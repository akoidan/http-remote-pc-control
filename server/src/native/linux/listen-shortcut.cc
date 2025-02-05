#include "./headers/listen-shortcut.h"
#include "./headers/key-names.h"
#include "./headers/modifier-names.h"
#include <napi.h>
#include <X11/Xlib.h>
#include <iostream>
#include <thread>
#include <atomic>
#include <unordered_map>
#include <cctype>

struct HotkeyContext {
    std::atomic<bool> running{true};
    Napi::ThreadSafeFunction tsfn;
    std::thread eventThread;
    Display* display;
    Window root;
    unsigned int modifiers;
    KeyCode keycode;
};


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

static std::unordered_map<int, HotkeyContext*> hotkeyContexts;
static int nextHotkeyId = 1;

void EventLoop(HotkeyContext* context) {
    XEvent event;
    
    while (context->running) {
        XNextEvent(context->display, &event);
        
        if (event.type == KeyPress) {
            unsigned int modifiers = event.xkey.state;
            KeyCode keycode = event.xkey.keycode;
            
            // Check if this matches our registered hotkey
            if (keycode == context->keycode && modifiers == context->modifiers) {
                auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                    jsCallback.Call({});
                };
                
                context->tsfn.BlockingCall(callback);
            }
        }
    }
}

Napi::Value RegisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get key string
    if (!info[0].IsString()) {
        Napi::TypeError::New(env, "First argument must be a string (key)").ThrowAsJavaScriptException();
        return env.Null();
    }
    std::string keyStr = info[0].As<Napi::String>().Utf8Value();

    // Get modifiers array
    if (!info[1].IsArray()) {
        Napi::TypeError::New(env, "Second argument must be an array of modifiers").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get callback
    if (!info[2].IsFunction()) {
        Napi::TypeError::New(env, "Third argument must be a callback function").ThrowAsJavaScriptException();
        return env.Null();
    }

    Display* display = XOpenDisplay(NULL);
    if (!display) {
        Napi::Error::New(env, "Failed to open X display").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Convert key string to KeySym
    KeySym keysym = NoSymbol;
    for (int i = 0; key_names[i].name != NULL; i++) {
        if (keyStr == key_names[i].name) {
            keysym = key_names[i].key;
            break;
        }
    }
    
    if (keysym == NoSymbol) {
        // Try as a single character
        if (keyStr.length() == 1) {
            char c = tolower(keyStr[0]);
            keysym = keyCodeForChar(c);
        }
    }

    if (keysym == NoSymbol) {
        XCloseDisplay(display);
        Napi::Error::New(env, "Invalid key name").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Convert modifiers array to mask
    Napi::Array modArray = info[1].As<Napi::Array>();
    unsigned int modifiers = 0;
    for (uint32_t i = 0; i < modArray.Length(); i++) {
        Napi::Value mod = modArray[i];
        if (!mod.IsString()) continue;
        
        std::string modStr = mod.As<Napi::String>().Utf8Value();
        auto it = modifier_names.find(modStr);
        if (it != modifier_names.end()) {
            modifiers |= it->second;
        }
    }

    KeyCode keycode = XKeysymToKeycode(display, keysym);
    if (keycode == 0) {
        XCloseDisplay(display);
        Napi::Error::New(env, "Could not map key to keycode").ThrowAsJavaScriptException();
        return env.Null();
    }

    Window root = DefaultRootWindow(display);
    XGrabKey(display, keycode, modifiers, root, True, GrabModeAsync, GrabModeAsync);
    XSelectInput(display, root, KeyPressMask);

    // Create hotkey context
    HotkeyContext* context = new HotkeyContext();
    context->display = display;
    context->root = root;
    context->modifiers = modifiers;
    context->keycode = keycode;
    context->tsfn = Napi::ThreadSafeFunction::New(
        env,
        info[2].As<Napi::Function>(),
        "Hotkey Callback",
        0,
        1
    );

    // Start event thread
    context->eventThread = std::thread(EventLoop, context);

    int hotkeyId = nextHotkeyId++;
    hotkeyContexts[hotkeyId] = context;

    return Napi::Number::New(env, hotkeyId);
}

Napi::Value UnregisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int hotkeyId = info[0].As<Napi::Number>().Int32Value();
    auto it = hotkeyContexts.find(hotkeyId);
    
    if (it != hotkeyContexts.end()) {
        HotkeyContext* context = it->second;
        context->running = false;
        
        // Ungrab the key
        XUngrabKey(context->display, context->keycode, context->modifiers, context->root);
        
        // Clean up
        context->eventThread.join();
        context->tsfn.Release();
        XCloseDisplay(context->display);
        delete context;
        
        hotkeyContexts.erase(it);
    }
    
    return env.Undefined();
}

Napi::Value CleanupHotkeys(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    for (auto& pair : hotkeyContexts) {
        HotkeyContext* context = pair.second;
        context->running = false;
        
        // Ungrab the key
        XUngrabKey(context->display, context->keycode, context->modifiers, context->root);
        
        // Clean up
        context->eventThread.join();
        context->tsfn.Release();
        XCloseDisplay(context->display);
        delete context;
    }
    
    hotkeyContexts.clear();
    return env.Undefined();
}

Napi::Object hotkey_init(Napi::Env env, Napi::Object exports) {
    exports.Set("registerHotkey", Napi::Function::New(env, RegisterHotkey));
    exports.Set("unregisterHotkey", Napi::Function::New(env, UnregisterHotkey));
    exports.Set("cleanupHotkeys", Napi::Function::New(env, CleanupHotkeys));
    return exports;
}
