#include <windows.h>
#include <ctype.h>
#include <napi.h>
#include <stdint.h>
#include "./headers/key-names.h"
#include "./headers/keypress.h"
#include "./headers/keyboard-layout.h"
#include <codecvt>
#include <locale>
#include "./headers/logger.h"

// Define all modifiers in one place
static const KeyModifier MODIFIERS[] = {
    {"shift", 1 << 0, VK_LSHIFT, 1},
    {"control", 1 << 1, VK_LCONTROL, 2},
    {"ctrl", 1 << 1, VK_LCONTROL, 2},
    {"alt", 1 << 2, VK_LMENU, 4},
    {"win", 1 << 3, VK_LWIN, 0},
    {"command", 1 << 3, VK_LWIN, 0},
    {"meta", 1 << 3, VK_LWIN, 0},
};
static const int MODIFIER_COUNT = sizeof(MODIFIERS) / sizeof(MODIFIERS[0]);

unsigned int getModifierFlag(const char* name) {
    for (int i = 0; i < MODIFIER_COUNT; i++) {
        if (strcmp(name, MODIFIERS[i].name) == 0) {
            return MODIFIERS[i].flag;
        }
    }
    return 0;
}

unsigned int getModifiersFromWindowsBits(int windowsModifiers) {
    unsigned int flags = 0;
    for (int i = 0; i < MODIFIER_COUNT; i++) {
        if (MODIFIERS[i].winBit && (windowsModifiers & MODIFIERS[i].winBit)) {
            flags |= MODIFIERS[i].flag;
        }
    }
    return flags;
}

// Helper function to convert Windows modifiers to our flags
unsigned int convertWindowsModifiersToFlags(int windowsModifiers) {
    return getModifiersFromWindowsBits(windowsModifiers);
}

void win32KeyEvent(int key, unsigned int flags) {
    UINT scan = MapVirtualKey(key & 0xff, MAPVK_VK_TO_VSC);

    /* Set the scan code for extended keys */
    switch (key)
    {
    case VK_RCONTROL:
    case VK_SNAPSHOT: /* Print Screen */
    case VK_RMENU:	  /* Right Alt / Alt Gr */
    case VK_PAUSE:	  /* Pause / Break */
    case VK_HOME:
    case VK_UP:
    case VK_PRIOR: /* Page up */
    case VK_LEFT:
    case VK_RIGHT:
    case VK_END:
    case VK_DOWN:
    case VK_NEXT: /* 'Page Down' */
    case VK_INSERT:
    case VK_DELETE:
    case VK_LWIN:
    case VK_RWIN:
    case VK_APPS: /* Application */
    case VK_VOLUME_MUTE:
    case VK_VOLUME_DOWN:
    case VK_VOLUME_UP:
    case VK_MEDIA_NEXT_TRACK:
    case VK_MEDIA_PREV_TRACK:
    case VK_MEDIA_STOP:
    case VK_MEDIA_PLAY_PAUSE:
    case VK_BROWSER_BACK:
    case VK_BROWSER_FORWARD:
    case VK_BROWSER_REFRESH:
    case VK_BROWSER_STOP:
    case VK_BROWSER_SEARCH:
    case VK_BROWSER_FAVORITES:
    case VK_BROWSER_HOME:
    case VK_LAUNCH_MAIL:
    {
        flags |= KEYEVENTF_EXTENDEDKEY;
        break;
    }
    }

    INPUT keyboardInput;
    keyboardInput.type = INPUT_KEYBOARD;
    keyboardInput.ki.wScan = (WORD)scan;
    keyboardInput.ki.wVk = (WORD)key;
    keyboardInput.ki.dwFlags = KEYEVENTF_SCANCODE | flags;
    keyboardInput.ki.time = 0;
    SendInput(1, &keyboardInput, sizeof(keyboardInput));
}

void toggleKeyCode(unsigned int code, const bool down, unsigned int flags) {
    const DWORD dwFlags = down ? 0 : KEYEVENTF_KEYUP;
    
    if (!down) {
        win32KeyEvent(code, dwFlags);
    }
    
    // Handle modifiers
    for (int i = 0; i < MODIFIER_COUNT; i++) {
        if (flags & MODIFIERS[i].flag) {
            win32KeyEvent(MODIFIERS[i].vkey, dwFlags);
        }
    }
    
    if (down) {
        win32KeyEvent(code, dwFlags);
    }
}

void toggleKey(char c, const bool down, unsigned int flags) {
    unsigned int keyCode = VkKeyScan(c);
    flags |= getModifiersFromWindowsBits(keyCode >> 8); // Add modifiers from VkKeyScan
    keyCode = keyCode & 0xff; // Mask out modifiers
    toggleKeyCode(keyCode, down, flags);
}

std::wstring utf8_to_utf16(const char* str) {
    try {
        std::wstring_convert<std::codecvt_utf8_utf16<wchar_t>> converter;
        return converter.from_bytes(str);
    } catch(...) {
        return std::wstring();
    }
}

void typeString(const char *str) {
    // Ensure Caps Lock is disabled before typing
    ensureCapsLockDisabled();
    
    HKL savedLayout = GetSystemKeyboardLayout();
    HKL currentLayout = savedLayout;

    // Convert input UTF-8 string to UTF-16
    std::wstring wstr = utf8_to_utf16(str);

    for(size_t i = 0; i < wstr.length(); i++) {
        wchar_t wc = wstr[i];
        
        // Skip surrogate pairs - we'll handle them in the next iteration
        if (i < wstr.length() - 1 && (0xD800 <= wc && wc <= 0xDBFF)) {
            continue;
        }

        // Detect language and switch layout if needed
        const char* detectedLang = DetectLanguageFromChar(wc);
        HKL neededLayout = GetKeyboardLayoutForLanguage(detectedLang);
        
        if (neededLayout != currentLayout) {
            std::ostringstream oss; oss << "Switching keyboard layout lang=" << detectedLang
                << " from=0x" << std::hex << reinterpret_cast<uintptr_t>(currentLayout)
                << " to=0x" << std::hex << reinterpret_cast<uintptr_t>(neededLayout);
            LOG(oss.str());
            SetThreadKeyboardLayout(neededLayout);
            currentLayout = neededLayout;
            Sleep(50);
            // wait timeout so first letters typging is not affected by lang changed
        }

        // Get virtual key and modifiers for the character
        UINT virtualKey, modifiers;
        if (GetVirtualKeyForChar(wc, currentLayout, &virtualKey, &modifiers)) {
            // Convert Windows modifiers to our flags
            unsigned int flags = getModifiersFromWindowsBits(modifiers);

            // Use toggleKeyCode to handle the keypress with modifiers
            toggleKeyCode(virtualKey, true, flags);
            toggleKeyCode(virtualKey, false, flags);
        } else {
            std::ostringstream oss; oss << "Unable to map character U+" << std::uppercase << std::hex << static_cast<unsigned int>(wc)
                << " to a virtual key for current layout";
            LOG(oss.str());
        }
    }
    // Restore the original layout, wait timeout so last letter typing is not affected by lang change
    // leave the layout as it was, fuck it
    // Sleep(50);
    // SetThreadKeyboardLayout(savedLayout);
}

unsigned int getFlag(napi_env env, napi_value value) {
    char buffer[32];
    size_t copied;
    napi_get_value_string_utf8(env, value, buffer, sizeof(buffer), &copied);
    return getModifierFlag(buffer);
}

unsigned int getAllFlags(napi_env env, napi_value value) {
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

unsigned int assignKeyCode(const char* keyName) {
    if (strlen(keyName) == 1) {
        return VkKeyScan(keyName[0]);
    }
    unsigned int res = 0;
    KeyNames *kn = key_names;
    while (kn->name) {
        if (_stricmp(keyName, kn->name) == 0) {
            return kn->key;
        }
        kn++;
    }
    return 0;
}

void _keyTap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    unsigned int flags = getAllFlags(env, info[1]);
    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName.c_str());
    toggleKeyCode(key, true, flags);
    toggleKeyCode(key, false, flags);
}

void _keyToggle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    bool down = info[2].As<Napi::Boolean>().Value();

    unsigned int flags = getAllFlags(env, info[1]);

    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName.c_str());

    toggleKeyCode(key, down, flags);
}

void _typeString(const Napi::CallbackInfo& info) {
    std::string str = info[0].As<Napi::String>();
    typeString(str.c_str());
}

void _setKeyboardLayout(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        throw Napi::Error::New(env, "String expected (layout ID)");
    }

    std::string layoutId = info[0].As<Napi::String>().Utf8Value();
    SetKeyboardLayout(layoutId.c_str(), info);
}

Napi::Object keyboard_init(Napi::Env env, Napi::Object exports) {
    exports.Set("keyTap", Napi::Function::New(env, _keyTap));
    exports.Set("keyToggle", Napi::Function::New(env, _keyToggle));
    exports.Set("typeString", Napi::Function::New(env, _typeString));
    exports.Set("setKeyboardLayout", Napi::Function::New(env, _setKeyboardLayout));
    return exports;
}
