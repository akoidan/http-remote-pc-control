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
#include "./headers/validators.h"

#define X_KEY_EVENT(display, key, is_press)                \
    (XTestFakeKeyEvent(display, XKeysymToKeycode(display, key), is_press, CurrentTime), XFlush(display))

void toggleKeyCode(Napi::Env env, KeySym code, const bool down, unsigned int flags) {
  Display* display = xGetMainDisplay(env);
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
    auto it = xSpecialCharacterMap.find(c);
    if (it != xSpecialCharacterMap.end()) {
      code = it->second;
    }
    else {
      auto shiftIt = xShiftRequiredMap.find(c);
      if (shiftIt != xShiftRequiredMap.end()) {
        code = shiftIt->second;
      }
    }
  }

  return code;
}

void toggleKey(Napi::Env env, char c, const bool down, unsigned int flags) {
  KeySym keyCode = keyCodeForChar(c);
  if (std::isupper(c) || xShiftRequiredMap.find(c) != xShiftRequiredMap.end()) {
    flags |= ShiftMask;
  }
  toggleKeyCode(env, keyCode, down, flags);
}

void typeString(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_STRING(info, 0, strstd);

  const char* str = strstd.c_str();
  Display* display = xGetMainDisplay(env);
  while (*str) {
    KeySym ks;
    bool needShift = false;

    // First check our special character map
    auto it = xSpecialCharacterMap.find(*str);
    if (it != xSpecialCharacterMap.end()) {
      ks = it->second;
    }
    else {
      // Then check shift-required map
      auto shiftIt = xShiftRequiredMap.find(*str);
      if (shiftIt != xShiftRequiredMap.end()) {
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
  bool isArray;
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
  KeyNames* kn = keyNames;
  while (kn->name) {
    if (keyName == kn->name) {
      return kn->key;
    }
    kn++;
  }
  return 0;
}

void keyTap(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  GET_STRING(info, 0, keyName);
  ASSERT_ARRAY(info, 1);
  unsigned int flags = getAllFlags(env, info[1]);
  unsigned int key = assignKeyCode(keyName);
  toggleKeyCode(env, key, true, flags);
  toggleKeyCode(env, key, false, flags);
}

void keyToggle(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_STRING(info, 0, keyName);
  ASSERT_ARRAY(info, 1);
  GET_BOOL(info, 2, down);

  unsigned int flags = getAllFlags(env, info[1]);

  unsigned int key = assignKeyCode(keyName);

  toggleKeyCode(env, key, down, flags);
}


void setKeyboardLayout(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_STRING(info, 0, layoutId);

  // Try KDE's DBus interface first - query available layouts and validate
  std::vector<KdeLayout> availableLayouts = getKdeAvailableLayouts();

  if (!availableLayouts.empty()) {
    // Check if requested layout is available and get its index
    int layoutIndex = -1;
    for (size_t i = 0; i < availableLayouts.size(); ++i) {
      if (availableLayouts[i].code == layoutId) {
        layoutIndex = i;
        break;
      }
    }

    if (layoutIndex == -1) {
      // Build error message with available layouts
      std::string availableList;
      for (size_t i = 0; i < availableLayouts.size(); ++i) {
        availableList += availableLayouts[i].code + " (" + availableLayouts[i].displayName + ")";
        if (i < availableLayouts.size() - 1) availableList += ", ";
      }

      throw Napi::Error::New(env, "Layout '" + layoutId + "' not found. Available layouts: " + availableList);
    }

    // Layout is available, try to switch to it by index
    if (switchToKdeLayout(layoutIndex)) {
      return;
    }

    throw Napi::Error::New(env, "Failed to switch to layout '" + layoutId + "' via KDE DBus");
  }

  // Fallback to direct XKB group switching (works on non-KDE systems or when DBus is unavailable)
  if (fallbackLayoutSwitch()) {
    return;
  }

  // If both methods fail, throw error
  throw Napi::Error::New(env, "Failed to switch keyboard layout. KDE service not available and XKB fallback failed.");
}


Napi::Object keyboardInit(Napi::Env env, Napi::Object exports) {
  exports.Set("keyTap", Napi::Function::New(env, keyTap));
  exports.Set("keyToggle", Napi::Function::New(env, keyToggle));
  exports.Set("typeString", Napi::Function::New(env, typeString));
  exports.Set("setKeyboardLayout", Napi::Function::New(env, setKeyboardLayout));
  return exports;
}