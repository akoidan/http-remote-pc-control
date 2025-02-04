#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include "./headers/key-names.h"
#include "./headers/modifier-names.h"

// Global variables to keep window and thread alive
static HWND g_messageWindow = NULL;
static bool g_threadRunning = false;
static std::mutex g_mutex;
static std::condition_variable g_cv;
static Napi::ThreadSafeFunction tsfn;

// Window procedure
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_HOTKEY) {
        std::cout << "Hotkey pressed! ID: " << wParam << std::endl;
        
        // Call JavaScript callback
        if (tsfn) {
            auto callback = [wParam](Napi::Env env, Napi::Function jsCallback) {
                jsCallback.Call({Napi::Number::New(env, wParam)});
            };
            tsfn.BlockingCall(callback);
        }
        return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

// Message pump worker
class MessagePumpWorker : public Napi::AsyncWorker {
public:
    MessagePumpWorker(Napi::Function& callback)
        : AsyncWorker(callback) {
        
        // Create ThreadSafeFunction
        tsfn = Napi::ThreadSafeFunction::New(
            callback.Env(),
            callback,
            "Hotkey Callback",
            0,
            1
        );
    }

    ~MessagePumpWorker() {
        if (tsfn) {
            tsfn.Release();
        }
    }

    void Execute() override {
        const wchar_t CLASS_NAME[] = L"HotkeyWindow";
        
        WNDCLASSW wc = {};
        wc.lpfnWndProc = WindowProc;
        wc.hInstance = GetModuleHandle(NULL);
        wc.lpszClassName = CLASS_NAME;
        
        if (!RegisterClassW(&wc)) {
            std::string error = "Failed to register window class. Error: " + std::to_string(GetLastError());
            SetError(error);
            return;
        }
        
        // Create hidden window
        g_messageWindow = CreateWindowExW(
            0,                              // Optional window styles
            CLASS_NAME,                     // Window class
            L"Hotkey Window",              // Window text
            WS_OVERLAPPED,                 // Window style
            0, 0, 0, 0,                    // Position and size
            NULL,                          // Parent window
            NULL,                          // Menu
            GetModuleHandle(NULL),         // Instance handle
            NULL                           // Additional application data
        );

        if (g_messageWindow == NULL) {
            std::string error = "Failed to create window. Error: " + std::to_string(GetLastError());
            SetError(error);
            return;
        }

        std::cout << "Window created successfully: " << std::hex << g_messageWindow << std::dec << std::endl;

        // Signal that window is ready
        {
            std::lock_guard<std::mutex> lock(g_mutex);
            g_threadRunning = true;
            g_cv.notify_one();
        }

        // Message loop
        MSG msg = {};
        while (GetMessage(&msg, NULL, 0, 0)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());
        Callback().Call({Env().Null(), Napi::String::New(Env(), "Message loop ended")});
    }

    void OnError(const Napi::Error& error) override {
        Napi::HandleScope scope(Env());
        Callback().Call({error.Value(), Env().Null()});
    }
};

// Function to ensure window is created
bool EnsureWindow(const Napi::Function& callback) {
    if (g_messageWindow != NULL) {
        return true;
    }

    // Create and queue the worker
    auto* worker = new MessagePumpWorker(const_cast<Napi::Function&>(callback));
    worker->Queue();

    // Wait for window to be created
    std::unique_lock<std::mutex> lock(g_mutex);
    g_cv.wait(lock, [] { return g_threadRunning; });

    return g_messageWindow != NULL;
}

// Register hotkey
Napi::Value RegisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::Error::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsString() || !info[1].IsArray() || !info[2].IsFunction()) {
        Napi::Error::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Ensure window exists
    if (!EnsureWindow(info[2].As<Napi::Function>())) {
        Napi::Error::New(env, "Failed to create message window").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get key
    std::string keyStr = info[0].As<Napi::String>().Utf8Value();
    
    // Convert key string to virtual key code
    int vk = 0;
    if (keyStr.length() == 1) {
        vk = keyStr[0];  // Use character directly like in test program
        std::cout << "Using key: " << keyStr << std::endl;
    } else {
        auto key_it = key_names.find(keyStr);
        if (key_it != key_names.end()) {
            vk = key_it->second;
            std::cout << "Found key '" << keyStr << "' in map: 0x" << std::hex << vk << std::dec << std::endl;
        }
    }

    if (vk == 0) {
        Napi::Error::New(env, "Invalid key name").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get modifiers (just like test program)
    UINT modifiers = 0;
    Napi::Array modArray = info[1].As<Napi::Array>();
    for (uint32_t i = 0; i < modArray.Length(); i++) {
        Napi::Value mod = modArray[i];
        if (!mod.IsString()) continue;
        
        std::string modStr = mod.As<Napi::String>().Utf8Value();
        if (modStr == "alt") modifiers |= MOD_ALT;
        else if (modStr == "ctrl" || modStr == "control") modifiers |= MOD_CONTROL;
        else if (modStr == "shift") modifiers |= MOD_SHIFT;
        else if (modStr == "win" || modStr == "meta") modifiers |= MOD_WIN;
    }

    // Register hotkey
    int hotkeyId = 1;
    std::cout << "Registering hotkey with modifiers=0x" << std::hex << modifiers << " vk=" << vk << std::dec << std::endl;
    if (!RegisterHotKey(g_messageWindow, hotkeyId, modifiers, vk)) {
        DWORD error = GetLastError();
        std::cout << "Failed to register hotkey. Error: " << error << std::endl;
        return env.Null();
    }

    std::cout << "Successfully registered hotkey!" << std::endl;
    return Napi::Number::New(env, hotkeyId);
}

// Unregister hotkey
Napi::Value UnregisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong arguments: expected (hotkeyId)").ThrowAsJavaScriptException();
        return env.Null();
    }

    int hotkeyId = info[0].As<Napi::Number>().Int32Value();
    UnregisterHotKey(g_messageWindow, hotkeyId);
    return env.Undefined();
}

// Cleanup hotkeys
Napi::Value CleanupHotkeys(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_messageWindow) {
        PostMessage(g_messageWindow, WM_QUIT, 0, 0);
    }
    
    if (tsfn) {
        tsfn.Release();
    }
    
    return env.Undefined();
}

// Initialize module
Napi::Object hotkey_init(Napi::Env env, Napi::Object exports) {
    std::cout << "Initializing module..." << std::endl;
    exports.Set("registerHotkey", Napi::Function::New(env, RegisterHotkey));
    exports.Set("unregisterHotkey", Napi::Function::New(env, UnregisterHotkey));
    exports.Set("cleanupHotkeys", Napi::Function::New(env, CleanupHotkeys));
    return exports;
}