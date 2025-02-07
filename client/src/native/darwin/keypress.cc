#include <napi.h>
#include <CoreGraphics/CoreGraphics.h>
#include <Carbon/Carbon.h>
#include <ctype.h>
#include "./headers/key-names.h"
#include "./headers/keypress.h"

// Mapping of modifier flags
const CGEventFlags modifierFlagMap[] = {
    0,                      // None
    kCGEventFlagMaskAlternate,   // Alt/Option
    kCGEventFlagMaskCommand,     // Command/Win
    kCGEventFlagMaskControl,     // Control
    kCGEventFlagMaskShift        // Shift
};

// Convert key name to Carbon virtual key code
unsigned int assignKeyCode(const char* keyName) {
    if (strlen(keyName) == 1) {
        // Use a fixed keyboard layout instead of GetScriptManagerVariable
        return KeyTranslate(GetKbdType(), keyName[0]);
    }
    
    auto it = key_names.find(keyName);
    if (it != key_names.end()) {
        return it->second;
    }
    return 0;
}

// Get modifier flags from string
unsigned int getFlag(napi_env env, napi_value value) {
    char buffer[32];
    size_t copied;
    napi_get_value_string_utf8(env, value, buffer, sizeof(buffer), &copied);

    if (strcmp(buffer, "alt") == 0) {
        return 1;  // Alt/Option
    } else if (strcmp(buffer, "command") == 0 || strcmp(buffer, "win") == 0 || strcmp(buffer, "meta") == 0) {
        return 2;  // Command
    } else if (strcmp(buffer, "control") == 0 || strcmp(buffer, "ctrl") == 0) {
        return 3;  // Control
    } else if (strcmp(buffer, "shift") == 0) {
        return 4;  // Shift
    }
    return 0;  // None
}

// Get combined modifier flags from array
unsigned int getAllFlags(napi_env env, napi_value value) {
    unsigned int flags = 0;
    uint32_t length;
    napi_get_array_length(env, value, &length);

    for (uint32_t i = 0; i < length; i++) {
        napi_value element;
        napi_get_element(env, value, i, &element);
        unsigned int f = getFlag(env, element);
        flags |= (1 << f);
    }
    return flags;
}

// Send a key event
void toggleKeyCode(unsigned int code, const bool down, unsigned int flags) {
    CGEventRef event;
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
    
    // Construct modifier flags
    CGEventFlags modifierFlags = 0;
    if (flags & (1 << 1)) modifierFlags |= kCGEventFlagMaskAlternate;
    if (flags & (1 << 2)) modifierFlags |= kCGEventFlagMaskCommand;
    if (flags & (1 << 3)) modifierFlags |= kCGEventFlagMaskControl;
    if (flags & (1 << 4)) modifierFlags |= kCGEventFlagMaskShift;
    
    // Create key event
    event = CGEventCreateKeyboardEvent(source, (CGKeyCode)code, down);
    CGEventSetFlags(event, modifierFlags);
    
    // Post the event
    CGEventPost(kCGHIDEventTap, event);
    
    // Clean up
    CFRelease(event);
    CFRelease(source);
}

// Toggle a character key
void toggleKey(char c, const bool down, unsigned int flags) {
    unsigned int keyCode = KeyTranslate(GetKbdType(), c);
    toggleKeyCode(keyCode, down, flags);
}

// Type a complete string
void typeString(const char *str) {
    while (*str) {
        unsigned long n = (unsigned char)*str++;
        toggleKey((char)n, true, 0);
        toggleKey((char)n, false, 0);
    }
}

// Node.js bindings for key tap
Napi::Value _keyTap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "First argument must be a string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string keyName = info[0].As<Napi::String>().Utf8Value();
    unsigned int flags = 0;
    
    if (info.Length() > 1 && info[1].IsArray()) {
        flags = getAllFlags(env, info[1]);
    }
    
    unsigned int keyCode = assignKeyCode(keyName.c_str());
    if (keyCode) {
        toggleKeyCode(keyCode, true, flags);
        toggleKeyCode(keyCode, false, flags);
    }
    
    return env.Null();
}

// Node.js bindings for key toggle
Napi::Value _keyToggle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsBoolean()) {
        Napi::TypeError::New(env, "First argument must be a string, second a boolean").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string keyName = info[0].As<Napi::String>().Utf8Value();
    bool down = info[1].As<Napi::Boolean>().Value();
    unsigned int flags = 0;
    
    if (info.Length() > 2 && info[2].IsArray()) {
        flags = getAllFlags(env, info[2]);
    }
    
    unsigned int keyCode = assignKeyCode(keyName.c_str());
    if (keyCode) {
        toggleKeyCode(keyCode, down, flags);
    }
    
    return env.Null();
}

// Node.js bindings for type string
Napi::Value _typeString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "First argument must be a string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string str = info[0].As<Napi::String>().Utf8Value();
    typeString(str.c_str());
    
    return env.Null();
}

// Initialize keyboard module
Napi::Object keyboard_init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "keyTap"), Napi::Function::New(env, _keyTap));
    exports.Set(Napi::String::New(env, "keyToggle"), Napi::Function::New(env, _keyToggle));
    exports.Set(Napi::String::New(env, "typeString"), Napi::Function::New(env, _typeString));
    return exports;
}
