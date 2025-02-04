#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <chrono>
#include <atomic>
#include <map>
#include "./headers/modifier-names.h"
#include "./headers/key-names.h"

extern std::map<std::string, int> modifier_names;
extern std::map<std::string, int> key_names;

static std::thread* g_printerThread = nullptr;
static std::atomic<bool> g_threadRunning{false};
static Napi::ThreadSafeFunction g_tsfn;
static UINT g_modifiers = 0;
static int g_vk = 0;
static std::atomic<bool> g_threadSleeping{true};  // Start in sleeping state

// Window procedure
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_HOTKEY) {
        std::cout << "Hotkey pressed! ID: " << wParam << std::endl;
        // Also call the callback
        if (g_tsfn) {
            auto callback = [wParam](Napi::Env env, Napi::Function jsCallback) {
                jsCallback.Call({Napi::Number::New(env, wParam)});
            };
            g_tsfn.NonBlockingCall(callback);
        }
        return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

void PrinterThread() {
    std::cout << "[Thread] Starting..." << std::endl;
    
    // Register window class
    const wchar_t CLASS_NAME[] = L"HotkeyTest";
    WNDCLASSW wc = {};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = CLASS_NAME;
    
    if (!RegisterClassW(&wc)) {
        std::cout << "Failed to register window class. Error: " << GetLastError() << std::endl;
        return;
    }

    // Create hidden window
    HWND hwnd = CreateWindowExW(
        0,                              // Optional window styles
        CLASS_NAME,                     // Window class
        L"Hotkey Test",                // Window text
        WS_OVERLAPPED,                 // Window style
        0, 0, 0, 0,                    // Position and size
        NULL,                          // Parent window
        NULL,                          // Menu
        GetModuleHandle(NULL),         // Instance handle
        NULL                           // Additional application data
    );

    if (hwnd == NULL) {
        std::cout << "Failed to create window. Error: " << GetLastError() << std::endl;
        return;
    }

    std::cout << "[Thread] Window created: " << std::hex << hwnd << std::dec << std::endl;
    std::cout << "[Thread] Sleeping until first registration..." << std::endl;

    // Sleep until first registration
    while (g_threadSleeping && g_threadRunning) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    if (!g_threadRunning) {
        std::cout << "[Thread] Shutting down before registration" << std::endl;
        DestroyWindow(hwnd);
        UnregisterClassW(CLASS_NAME, GetModuleHandle(NULL));
        return;
    }

    std::cout << "[Thread] Woke up, registering hotkey..." << std::endl;

    // Register hotkey
    if (!RegisterHotKey(hwnd, 1, g_modifiers, g_vk)) {
        std::cout << "Failed to register hotkey. Error: " << GetLastError() << std::endl;
        return;
    }

    std::cout << "Hotkey registered successfully. Press " << (g_modifiers & MOD_ALT ? "Alt+" : "") << (g_modifiers & MOD_CONTROL ? "Ctrl+" : "") << (g_modifiers & MOD_SHIFT ? "Shift+" : "") << (g_modifiers & MOD_WIN ? "Win+" : "") << char(g_vk) << std::endl;

    // Message loop with periodic callback to keep Node.js alive
    MSG msg = {};
    std::cout << "[Thread] Starting message loop" << std::endl;
    while (g_threadRunning) {
        // Process all pending messages
        while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }

        // Call empty JS callback just to keep Node.js alive
        if (g_tsfn) {
            auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                // Empty callback, just to keep Node.js alive
            };
            g_tsfn.NonBlockingCall(callback);
        }

        // Sleep a bit to avoid busy loop
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    // Cleanup
    UnregisterHotKey(hwnd, 1);
    DestroyWindow(hwnd);
    UnregisterClassW(CLASS_NAME, GetModuleHandle(NULL));
}

// Register hotkey
Napi::Value RegisterHotkey(const Napi::CallbackInfo& info) {
    std::cout << "[Main] Registering new hotkey" << std::endl;
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsString() || !info[1].IsArray() || !info[2].IsFunction()) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get key
    std::string keyStr = info[0].As<Napi::String>().Utf8Value();
    std::transform(keyStr.begin(), keyStr.end(), keyStr.begin(), ::tolower);  // Convert to lowercase
    
    int vk = 0;
    auto key_it = key_names.find(keyStr);
    if (key_it != key_names.end()) {
        vk = key_it->second;
    }

    if (vk == 0) {
        Napi::Error::New(env, "Invalid key name: " + keyStr).ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get modifiers
    UINT modifiers = 0;
    Napi::Array modArray = info[1].As<Napi::Array>();
    for (uint32_t i = 0; i < modArray.Length(); i++) {
        Napi::Value mod = modArray[i];
        if (!mod.IsString()) continue;
        
        std::string modifierStr = mod.As<Napi::String>().Utf8Value();
        auto mod_it = modifier_names.find(modifierStr);
        if (mod_it != modifier_names.end()) {
            modifiers |= mod_it->second;
        }
    }

    g_modifiers = modifiers;
    g_vk = vk;

    // Create a ThreadSafeFunction with the actual callback
    g_tsfn = Napi::ThreadSafeFunction::New(
        env,
        info[2].As<Napi::Function>(),  // Use the provided callback
        "Hotkey Thread",
        0,  // Unlimited queue
        1   // Only one thread will use this
    );

    // Wake up the thread
    g_threadSleeping = false;

    return env.Undefined();
}

// Unregister hotkey
Napi::Value UnregisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return env.Undefined();
}

// Cleanup
Napi::Value CleanupHotkeys(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_printerThread) {
        g_threadRunning = false;
        g_printerThread->join();
        delete g_printerThread;
        g_printerThread = nullptr;

        // Release the ThreadSafeFunction
        if (g_tsfn) {
            g_tsfn.Release();
        }
    }
    
    return env.Undefined();
}

// Initialize module
Napi::Object hotkey_init(Napi::Env env, Napi::Object exports) {
    std::cout << "Initializing Windows module..." << std::endl;
    
    // Start the thread in sleeping state
    g_threadRunning = true;
    g_threadSleeping = true;
    g_printerThread = new std::thread(PrinterThread);
    
    exports.Set("registerHotkey", Napi::Function::New(env, RegisterHotkey));
    exports.Set("unregisterHotkey", Napi::Function::New(env, UnregisterHotkey));
    exports.Set("cleanupHotkeys", Napi::Function::New(env, CleanupHotkeys));
    return exports;
}