#include <windows.h>
#include <ctype.h> /* For isupper() */
#include <napi.h>
#include <stdint.h>
#include "./headers/key-names.h"
#include "./headers/keypress.h"
#include "./headers/keyboard-layout.h"
#include <codecvt>
#include <locale>

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
    /* Parse modifier keys. */
    if (flags & MOD_WIN) {
        win32KeyEvent(VK_LWIN, dwFlags);
    }
    if (flags & MOD_ALT) {
        win32KeyEvent(VK_LMENU, dwFlags);
    }
    if (flags & MOD_CONTROL) {
        win32KeyEvent(VK_LCONTROL, dwFlags);
    }
    if (flags & MOD_SHIFT) {
        win32KeyEvent(VK_LSHIFT, dwFlags);
    }
    if (down) {
        win32KeyEvent(code, dwFlags);
    }
}

void toggleKey(char c, const bool down, unsigned int flags) {
	unsigned int keyCode = VkKeyScan(c);

	int modifiers = keyCode >> 8; // Pull out modifers.
	if ((modifiers & 1) != 0)
		flags |= MOD_SHIFT; // Update flags from keycode modifiers.
	if ((modifiers & 2) != 0)
		flags |= MOD_CONTROL;
	if ((modifiers & 4) != 0)
		flags |= MOD_ALT;
	keyCode = keyCode & 0xff; // Mask out modifiers.
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
    HKL savedLayout = GetCurrentKeyboardLayout();
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
            if (SetThreadKeyboardLayout(neededLayout)) {
                currentLayout = neededLayout;
                Sleep(50); // Give Windows time to switch layouts
            }
        }

        // Get virtual key and modifiers for the character
        UINT virtualKey, modifiers;
        if (GetVirtualKeyForChar(wc, currentLayout, &virtualKey, &modifiers)) {
            // Convert Windows modifiers to our flags
            unsigned int flags = 0;
            if (modifiers & 1) flags |= MOD_SHIFT;
            if (modifiers & 2) flags |= MOD_CONTROL;
            if (modifiers & 4) flags |= MOD_ALT;

            // Use toggleKeyCode to handle the keypress with modifiers
            toggleKeyCode(virtualKey, true, flags);
            toggleKeyCode(virtualKey, false, flags);
        }
    }

    // Restore the original keyboard layout
    SetThreadKeyboardLayout(savedLayout);
}

unsigned int getFlag(napi_env env, napi_value value) {
    unsigned int flags = 0;
    char buffer[32];
    size_t copied;
    napi_get_value_string_utf8(env, value, buffer, sizeof(buffer), &copied);

    if (strcmp(buffer, "alt") == 0) {
        flags = MOD_ALT;
    } else if (strcmp(buffer, "command") == 0 || strcmp(buffer, "win") == 0 || strcmp(buffer, "meta") == 0) {
        flags = MOD_WIN;
    } else if (strcmp(buffer, "control") == 0 || strcmp(buffer, "ctrl") == 0) {
        flags = MOD_CONTROL;
    } else if (strcmp(buffer, "shift") == 0) {
        flags = MOD_SHIFT;
    } else if (strcmp(buffer, "none") == 0) {
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

Napi::Value _keyTap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    unsigned int flags = getAllFlags(env, info[1]);
    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName.c_str());
    toggleKeyCode(key, true, flags);
    toggleKeyCode(key, false, flags);
    return env.Undefined();
}

Napi::Value _keyToggle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    bool down = info[2].As<Napi::Boolean>().Value();

    unsigned int flags = getAllFlags(env, info[1]);

    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName.c_str());

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
    exports.Set(Napi::String::New(env, "keyTap"), Napi::Function::New(env, _keyTap));
    exports.Set(Napi::String::New(env, "keyToggle"), Napi::Function::New(env, _keyToggle));
    exports.Set(Napi::String::New(env, "typeString"), Napi::Function::New(env, _typeString));
    return exports;
}
