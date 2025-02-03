#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <atomic>
#include <unordered_map>
#include <cctype>
#include "./headers/key-names.h"
#include "./headers/modifier-names.h"

const wchar_t* WINDOW_CLASS_NAME = L"HotkeyMessageWindow";

struct HotkeyContext {
    std::atomic<bool> running{true};
    Napi::ThreadSafeFunction tsfn;
    std::thread messageThread;
    HWND hwnd;
    int modifiers;
    int key;
    Napi::Reference<Napi::Value> ref;
};

static std::map<int, HotkeyContext*> hotkeyContexts;
static int nextHotkeyId = 1;

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_HOTKEY) {
        int hotkeyId = static_cast<int>(wParam);
        std::cout << "HOTKEY PRESSED! ID: " << hotkeyId << std::endl;
        auto it = hotkeyContexts.find(hotkeyId);
        if (it != hotkeyContexts.end()) {
            auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                jsCallback.Call({});
            };
            it->second->tsfn.BlockingCall(callback);
            return 0;
        }
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

HWND CreateMessageWindow() {
    WNDCLASSEXW wc = {};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = WINDOW_CLASS_NAME;
    
    if (!RegisterClassExW(&wc)) {
        std::cout << "Failed to register window class. Error: " << GetLastError() << std::endl;
        return NULL;
    }
    
    HWND hwnd = CreateWindowExW(
        0,
        WINDOW_CLASS_NAME,
        L"Hotkey Message Window",
        WS_POPUP,
        0, 0, 0, 0,
        HWND_MESSAGE,
        NULL,
        GetModuleHandle(NULL),
        NULL
    );
    
    if (hwnd == NULL) {
        std::cout << "Failed to create message window. Error: " << GetLastError() << std::endl;
    }
    
    return hwnd;
}

void MessageLoop(HotkeyContext* context) {
    context->hwnd = CreateMessageWindow();
    if (!context->hwnd) {
        std::cout << "Failed to create message window, message loop exiting" << std::endl;
        return;
    }
    
    // Register hotkey
    int hotkeyId = nextHotkeyId - 1;
    if (!RegisterHotKey(NULL, hotkeyId, context->modifiers, context->key)) {
        DWORD error = GetLastError();
        std::cout << "Failed to register global hotkey. Error: " << error << std::endl;
        
        if (!RegisterHotKey(context->hwnd, hotkeyId, context->modifiers, context->key)) {
            error = GetLastError();
            std::cout << "Failed to register window hotkey. Error: " << error << std::endl;
            return;
        }
    }
    
    MSG msg;
    while (context->running && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    
    if (context->hwnd) {
        DestroyWindow(context->hwnd);
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

    // Convert key string to virtual key code
    int vk = 0;
    
    // First check named keys
    auto key_it = key_names.find(keyStr);
    if (key_it != key_names.end()) {
        vk = key_it->second;
    }
    
    // If not found, try as single character
    if (vk == 0 && keyStr.length() == 1) {
        char c = toupper(keyStr[0]);
        vk = c;  // For letters A-Z, the virtual key code is the same as the ASCII code
    }

    if (vk == 0) {
        Napi::Error::New(env, "Invalid key name").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Convert modifiers array to Windows modifier flags
    Napi::Array modArray = info[1].As<Napi::Array>();
    int modifiers = 0;
    
    for (uint32_t i = 0; i < modArray.Length(); i++) {
        Napi::Value mod = modArray[i];
        if (!mod.IsString()) continue;
        
        std::string modStr = mod.As<Napi::String>().Utf8Value();
        auto mod_it = modifier_names.find(modStr);
        if (mod_it != modifier_names.end()) {
            modifiers |= mod_it->second;
        } else {
            std::cout << "Warning: Unknown modifier '" << modStr << "'" << std::endl;
        }
    }

    // Add MOD_NOREPEAT to prevent auto-repeat
    modifiers |= MOD_NOREPEAT;

    // Create hotkey context
    auto context = new HotkeyContext();
    context->modifiers = modifiers;
    context->key = vk;
    context->tsfn = Napi::ThreadSafeFunction::New(
        env,
        info[2].As<Napi::Function>(),
        "Hotkey Callback",
        0,
        1
    );
    
    // Keep Node.js alive
    context->ref = Napi::Reference<Napi::Value>::New(env.Global(), 1);

    // Start message loop thread
    context->messageThread = std::thread(MessageLoop, context);
    
    int hotkeyId = nextHotkeyId++;
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
        if (context->hwnd) {
            UnregisterHotKey(context->hwnd, hotkeyId);
            PostMessage(context->hwnd, WM_QUIT, 0, 0);
        }
        
        if (context->messageThread.joinable()) {
            context->messageThread.join();
        }
        
        context->tsfn.Release();
        context->ref.Unref();
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
        if (context->hwnd) {
            UnregisterHotKey(context->hwnd, pair.first);
            PostMessage(context->hwnd, WM_QUIT, 0, 0);
        }
        
        if (context->messageThread.joinable()) {
            context->messageThread.join();
        }
        
        context->tsfn.Release();
        context->ref.Unref();
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