#include <ctype.h>
#include <napi.h>
#include <X11/extensions/XTest.h>
#include <X11/Xlib.h>
#include <X11/keysym.h>
#include <X11/Xatom.h>
#include <X11/XKBlib.h>
#include <X11/extensions/XKB.h>
#include <X11/extensions/XKBrules.h>
#include <string.h>
#include <cstring>
#include <iostream>
#include <map>
#include <algorithm>
#include <vector>
#include <sstream>
#include <dbus/dbus.h>
#include "./headers/key-names.h"
#include "./headers/display.h"
#include "./headers/keypress.h"

#define X_KEY_EVENT(display, key, is_press)                \
    (XTestFakeKeyEvent(display, XKeysymToKeycode(display, key), is_press, CurrentTime), XFlush(display))

void toggleKeyCode(KeySym code, const bool down, unsigned int flags) {
    Display *display = XGetMainDisplay();
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
        } else {
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
    if (isupper(c) || XShiftRequiredMap.find(c) != XShiftRequiredMap.end()) {
        flags |= ShiftMask;
    }
    toggleKeyCode(keyCode, down, flags);
}

void typeString(const char *str) {
    Display *display = XGetMainDisplay();
    while (*str) {
        KeySym ks;
        bool needShift = false;
        
        // First check our special character map
        auto it = XSpecialCharacterMap.find(*str);
        if (it != XSpecialCharacterMap.end()) {
            ks = it->second;
        } else {
            // Then check shift-required map
            auto shiftIt = XShiftRequiredMap.find(*str);
            if (shiftIt != XShiftRequiredMap.end()) {
                ks = shiftIt->second;
                needShift = true;
            } else {
                // Finally try normal character conversion
                char buf[2] = {*str, 0};
                ks = XStringToKeysym(buf);
            }
        }

        if (ks != NoSymbol) {
            KeyCode kc = XKeysymToKeycode(display, ks);
            if (kc != 0) {
                if (needShift || isupper(*str)) {
                    XTestFakeKeyEvent(display, XKeysymToKeycode(display, XK_Shift_L), True, CurrentTime);
                    XFlush(display);
                }
                
                XTestFakeKeyEvent(display, kc, True, CurrentTime);
                XFlush(display);
                XTestFakeKeyEvent(display, kc, False, CurrentTime);
                XFlush(display);
                
                if (needShift || isupper(*str)) {
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
    } else if (strcmp(buffer, "command") == 0 || strcmp(buffer, "win") == 0 || strcmp(buffer, "meta") == 0) {
        flags = Mod4Mask;
    } else if (strcmp(buffer, "control") == 0 || strcmp(buffer, "ctrl") == 0) {
        flags = ControlMask;
    } else if (strcmp(buffer, "shift") == 0) {
        flags = ShiftMask;
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

        flags = (unsigned int) (flags | f);
    }
    return flags;
}

unsigned int assignKeyCode(std::string &keyName) {
    if (keyName.length() == 1) {
        return keyCodeForChar(keyName[0]);
    }
    unsigned int res = 0;
    KeyNames *kn = key_names;
    while (kn->name) {
        if (keyName == kn->name) {
            return kn->key;
        }
        kn++;
    }
    return 0;
}

Napi::Value _keyTap(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    unsigned int flags = getAllFlags(env, info[1]);
    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName);
    toggleKeyCode(key, true, flags);
    toggleKeyCode(key, false, flags);
    return env.Undefined();
}

Napi::Value _keyToggle(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    bool down = info[2].As<Napi::Boolean>().Value();

    unsigned int flags = getAllFlags(env, info[1]);

    std::string keyName = info[0].As<Napi::String>();
    unsigned int key = assignKeyCode(keyName);

    toggleKeyCode(key, down, flags);
    return env.Undefined();
}

Napi::Value _typeString(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    std::string str = info[0].As<Napi::String>();
    typeString(str.c_str());

    return env.Undefined();
}

struct KdeLayout {
    std::string code;
    std::string variant;
    std::string displayName;
};

std::vector<KdeLayout> getKdeAvailableLayouts() {
    std::vector<KdeLayout> layouts;
    DBusError error;
    DBusConnection* connection;
    DBusMessage* message;
    DBusMessage* reply;
    
    dbus_error_init(&error);
    
    connection = dbus_bus_get(DBUS_BUS_SESSION, &error);
    if (dbus_error_is_set(&error) || !connection) {
        if (dbus_error_is_set(&error)) dbus_error_free(&error);
        return layouts;
    }
    
    // Get list of available layouts
    message = dbus_message_new_method_call(
        "org.kde.keyboard",
        "/Layouts", 
        "org.kde.KeyboardLayouts",
        "getLayoutsList"
    );
    
    if (!message) {
        dbus_connection_unref(connection);
        return layouts;
    }
    
    reply = dbus_connection_send_with_reply_and_block(connection, message, 1000, &error);
    dbus_message_unref(message);
    
    if (!dbus_error_is_set(&error) && reply) {
        DBusMessageIter iter, array_iter, struct_iter;
        dbus_message_iter_init(reply, &iter);
        
        if (dbus_message_iter_get_arg_type(&iter) == DBUS_TYPE_ARRAY) {
            dbus_message_iter_recurse(&iter, &array_iter);
            
            while (dbus_message_iter_get_arg_type(&array_iter) == DBUS_TYPE_STRUCT) {
                dbus_message_iter_recurse(&array_iter, &struct_iter);
                
                KdeLayout layout;
                const char* str;
                
                // First string: layout code
                if (dbus_message_iter_get_arg_type(&struct_iter) == DBUS_TYPE_STRING) {
                    dbus_message_iter_get_basic(&struct_iter, &str);
                    layout.code = std::string(str);
                    dbus_message_iter_next(&struct_iter);
                }
                
                // Second string: variant
                if (dbus_message_iter_get_arg_type(&struct_iter) == DBUS_TYPE_STRING) {
                    dbus_message_iter_get_basic(&struct_iter, &str);
                    layout.variant = std::string(str);
                    dbus_message_iter_next(&struct_iter);
                }
                
                // Third string: display name
                if (dbus_message_iter_get_arg_type(&struct_iter) == DBUS_TYPE_STRING) {
                    dbus_message_iter_get_basic(&struct_iter, &str);
                    layout.displayName = std::string(str);
                }
                
                layouts.push_back(layout);
                dbus_message_iter_next(&array_iter);
            }
        }
        dbus_message_unref(reply);
    }
    
    if (dbus_error_is_set(&error)) {
        dbus_error_free(&error);
    }
    
    dbus_connection_unref(connection);
    return layouts;
}

bool switchToKdeLayout(uint32_t layoutIndex) {
    DBusError error;
    DBusConnection* connection;
    DBusMessage* message;
    DBusMessage* reply;
    
    dbus_error_init(&error);
    
    connection = dbus_bus_get(DBUS_BUS_SESSION, &error);
    if (dbus_error_is_set(&error) || !connection) {
        if (dbus_error_is_set(&error)) dbus_error_free(&error);
        return false;
    }
    
    // Switch to specific layout by index
    message = dbus_message_new_method_call(
        "org.kde.keyboard",
        "/Layouts",
        "org.kde.KeyboardLayouts", 
        "setLayout"
    );
    
    if (!message) {
        dbus_connection_unref(connection);
        return false;
    }
    
    // Add layout index as parameter (uint32)
    dbus_message_append_args(message, DBUS_TYPE_UINT32, &layoutIndex, DBUS_TYPE_INVALID);
    
    reply = dbus_connection_send_with_reply_and_block(connection, message, 1000, &error);
    dbus_message_unref(message);
    
    bool success = false;
    if (!dbus_error_is_set(&error) && reply) {
        success = true;
        dbus_message_unref(reply);
    }
    
    if (dbus_error_is_set(&error)) {
        dbus_error_free(&error);
    }
    
    dbus_connection_unref(connection);
    return success;
}

bool fallbackLayoutSwitch() {
    Display* display = XGetMainDisplay();
    if (!display) {
        return false;
    }
    
    // Get current XKB state
    XkbStateRec state;
    if (XkbGetState(display, XkbUseCoreKbd, &state) != Success) {
        return false;
    }
    
    // Get number of available groups
    XkbDescPtr xkb = XkbAllocKeyboard();
    if (!xkb || XkbGetControls(display, XkbAllControlsMask, xkb) != Success) {
        if (xkb) XkbFreeKeyboard(xkb, 0, True);
        return false;
    }
    
    int numGroups = xkb->ctrls->num_groups;
    XkbFreeKeyboard(xkb, 0, True);
    
    if (numGroups <= 1) {
        return false; // Can't switch if only one group
    }
    
    // Simple cycling to next group
    int targetGroup = (state.group + 1) % numGroups;
    
    bool success = XkbLockGroup(display, XkbUseCoreKbd, targetGroup);
    if (success) {
        XFlush(display);
    }
    
    return success;
}

Napi::Value _setKeyboardLayout(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected (layout ID)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string layoutId = info[0].As<Napi::String>();
    
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
            
            Napi::TypeError::New(env, "Layout '" + layoutId + "' not found. Available layouts: " + availableList).ThrowAsJavaScriptException();
            return env.Undefined();
        }
        
        // Layout is available, try to switch to it by index
        if (switchToKdeLayout(layoutIndex)) {
            return env.Undefined();
        }
        
        Napi::TypeError::New(env, "Failed to switch to layout '" + layoutId + "' via KDE DBus").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    // Fallback to direct XKB group switching (works on non-KDE systems or when DBus is unavailable)
    if (fallbackLayoutSwitch()) {
        return env.Undefined();
    }
    
    // If both methods fail, throw error
    Napi::TypeError::New(env, "Failed to switch keyboard layout. KDE service not available and XKB fallback failed.").ThrowAsJavaScriptException();
    return env.Undefined();
}

Napi::Object keyboard_init(Napi::Env env, Napi::Object exports) {
    exports.Set("keyTap", Napi::Function::New(env, _keyTap));
    exports.Set("keyToggle", Napi::Function::New(env, _keyToggle));
    exports.Set("typeString", Napi::Function::New(env, _typeString));
    exports.Set("setKeyboardLayout", Napi::Function::New(env, _setKeyboardLayout));
    return exports;
}
