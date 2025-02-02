#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <atomic>
#include <unordered_map>

struct HotkeyContext {
    std::atomic<bool> running{true};
    Napi::ThreadSafeFunction tsfn;
    std::thread messageThread;
};

// Global map to store hotkey contexts
static std::unordered_map<int, HotkeyContext*> hotkeyContexts;
static int nextHotkeyId = 1;

void MessageLoop(HotkeyContext* context) {
    MSG msg;
    while (context->running && GetMessage(&msg, NULL, 0, 0)) {
        if (msg.message == WM_HOTKEY) {
            auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                jsCallback.Call({});
            };
            context->tsfn.BlockingCall(callback);
        }
    }
}

Napi::Value RegisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsFunction()) {
        Napi::TypeError::New(env, "Wrong arguments: expected (modifiers, key, callback)").ThrowAsJavaScriptException();
        return env.Null();
    }

    int modifiers = info[0].As<Napi::Number>().Int32Value();
    int key = info[1].As<Napi::Number>().Int32Value();
    Napi::Function callback = info[2].As<Napi::Function>();

    int hotkeyId = nextHotkeyId++;

    if (!RegisterHotKey(NULL, hotkeyId, modifiers, key)) {
        Napi::Error::New(env, "Failed to register hotkey").ThrowAsJavaScriptException();
        return env.Null();
    }

    auto context = new HotkeyContext();
    context->tsfn = Napi::ThreadSafeFunction::New(
        env,
        callback,
        "Hotkey Callback",
        0,
        1
    );

    context->messageThread = std::thread(MessageLoop, context);
    hotkeyContexts[hotkeyId] = context;

    return Napi::Number::New(env, hotkeyId);
}

Napi::Value UnregisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong arguments: expected (hotkeyId)").ThrowAsJavaScriptException();
        return env.Null();
    }

    int hotkeyId = info[0].As<Napi::Number>().Int32Value();
    auto it = hotkeyContexts.find(hotkeyId);
    
    if (it != hotkeyContexts.end()) {
        HotkeyContext* context = it->second;
        context->running = false;
        UnregisterHotKey(NULL, hotkeyId);
        
        // Post a dummy message to break the message loop
        PostThreadMessage(GetThreadId(context->messageThread.native_handle()), WM_NULL, 0, 0);
        
        if (context->messageThread.joinable()) {
            context->messageThread.join();
        }
        
        context->tsfn.Release();
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
        UnregisterHotKey(NULL, pair.first);
        
        // Post a dummy message to break the message loop
        PostThreadMessage(GetThreadId(context->messageThread.native_handle()), WM_NULL, 0, 0);
        
        if (context->messageThread.joinable()) {
            context->messageThread.join();
        }
        
        context->tsfn.Release();
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