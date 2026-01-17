#include <napi.h>
#include <X11/extensions/XTest.h>
#include <X11/Xlib.h>
#include <X11/keysym.h>
#include <cstring>
#include <cctype>
#include "./headers/key-names.h"
#include "./headers/display.h"
#include "./headers/keypress.h"
#include "./headers/keyboard-layout.h"

#define X_KEY_EVENT(display, key, is_press)                \
    (XTestFakeKeyEvent(display, XKeysymToKeycode(display, key), is_press, CurrentTime), XFlush(display))

void toggleKeyCode(KeySym code, const bool down, unsigned int flags) {
  Display* display = XGetMainDisplay();
  const Bool is_press = down ? True : False; /* Just to be safe. */
  if (!down) {
    X_KEY_EVENT(display, code, is_press);
  }

  if (flags & Mod4Mask)
    X_KEY_EVENT(display, XK_Super_L, is_press);
  if (flags & Mod1Mask)
    X_KEY_EVENT(display, XK_Alt_L, is_press);
  if (flags & ControlMask)
    X_KEY_EVENT(display, XK_Control_L, is_press);
  if (flags & ShiftMask)
    X_KEY_EVENT(display, XK_Shift_L, is_press);

  if (down) {
    X_KEY_EVENT(display, code, is_press);
  }
}

KeySym keyCodeForChar(const char c) {
  KeySym code;

  char buf[2];
  buf[0] = c;
  buf[1] = '\0';

  code = XStringToKeysym(buf);
  if (code == NoSymbol) {
    auto it = XSpecialCharacterMap.find(c);
    if (it != XSpecialCharacterMap.end()) {
      code = it->second;
    }
    else {
      auto shiftIt = XShiftRequiredMap.find(c);
      if (shiftIt != XShiftRequiredMap.end()) {
        code = shiftIt->second;
      }
    }
  }

  return code;
}

void toggleKey(char c, const bool down, unsigned int flags) {
  KeySym keyCode = keyCodeForChar(c);
  if (std::isupper(c) || XShiftRequiredMap.find(c) != XShiftRequiredMap.end()) {
    flags |= ShiftMask;
  }
  toggleKeyCode(keyCode, down, flags);
}

void typeString(const char* str) {
  Display* display = XGetMainDisplay();
  while (*str) {
    KeySym ks;
    bool needShift = false;

    // First check our special character map
    auto it = XSpecialCharacterMap.find(*str);
    if (it != XSpecialCharacterMap.end()) {
      ks = it->second;
    }
    else {
      // Then check shift-required map
      auto shiftIt = XShiftRequiredMap.find(*str);
      if (shiftIt != XShiftRequiredMap.end()) {
        ks = shiftIt->second;
        needShift = true;
      }
      else {
        // Finally try normal character conversion
        char buf[2] = {*str, 0};
        ks = XStringToKeysym(buf);
      }
    }

    if (ks != NoSymbol) {
      KeyCode kc = XKeysymToKeycode(display, ks);
      if (kc != 0) {
        if (needShift || std::isupper(*str)) {
          XTestFakeKeyEvent(display, XKeysymToKeycode(display, XK_Shift_L), True, CurrentTime);
          XFlush(display);
        }

        XTestFakeKeyEvent(display, kc, True, CurrentTime);
        XFlush(display);
        XTestFakeKeyEvent(display, kc, False, CurrentTime);
        XFlush(display);

        if (needShift || std::isupper(*str)) {
          XTestFakeKeyEvent(display, XKeysymToKeycode(display, XK_Shift_L), False, CurrentTime);
          XFlush(display);
        }
      }
    }
    str++;
  }
}

unsigned int getFlag(napi_env env, napi_value value) {
  unsigned int flags = 0;
  char buffer[32];
  size_t copied;
  napi_get_value_string_utf8(env, value, buffer, sizeof(buffer), &copied);

  if (strcmp(buffer, "alt") == 0) {
    flags = Mod1Mask;
  }
  else if (strcmp(buffer, "command") == 0 || strcmp(buffer, "win") == 0 || strcmp(buffer, "meta") == 0) {
    flags = Mod4Mask;
  }
  else if (strcmp(buffer, "control") == 0 || strcmp(buffer, "ctrl") == 0) {
    flags = ControlMask;
  }
  else if (strcmp(buffer, "shift") == 0) {
    flags = ShiftMask;
  }
  else if (strcmp(buffer, "none") == 0) {
    flags = 0;
  }

  return flags;
}

unsigned int getAllFlags(napi_env env, napi_value value) {
  bool is_array;
  unsigned int flags = 0;

  uint32_t length;
  napi_get_array_length(env, value, &length);

  for (uint32_t i = 0; i < length; i++) {
    napi_value element;
    napi_get_element(env, value, i, &element);
    unsigned int f = getFlag(env, element);

    flags = (unsigned int)(flags | f);
  }
  return flags;
}

unsigned int assignKeyCode(std::string& keyName) {
  if (keyName.length() == 1) {
    return keyCodeForChar(keyName[0]);
  }
  unsigned int res = 0;
  KeyNames* kn = key_names;
  while (kn->name) {
    if (keyName == kn->name) {
      return kn->key;
    }
    kn++;
  }
  return 0;
}

Napi::Value _keyTap(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  unsigned int flags = getAllFlags(env, info[1]);
  std::string keyName = info[0].As<Napi::String>();
  unsigned int key = assignKeyCode(keyName);
  toggleKeyCode(key, true, flags);
  toggleKeyCode(key, false, flags);
  return env.Undefined();
}

Napi::Value _keyToggle(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  bool down = info[2].As<Napi::Boolean>().Value();

  unsigned int flags = getAllFlags(env, info[1]);

  std::string keyName = info[0].As<Napi::String>();
  unsigned int key = assignKeyCode(keyName);

  toggleKeyCode(key, down, flags);
  return env.Undefined();
}

Napi::Value _typeString(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  std::string str = info[0].As<Napi::String>();
  typeString(str.c_str());

  return env.Undefined();
}


Napi::Object keyboard_init(Napi::Env env, Napi::Object exports) {
  exports.Set("keyTap", Napi::Function::New(env, _keyTap));
  exports.Set("keyToggle", Napi::Function::New(env, _keyToggle));
  exports.Set("typeString", Napi::Function::New(env, _typeString));
  exports.Set("setKeyboardLayout", Napi::Function::New(env, _setKeyboardLayout));
  return exports;
}