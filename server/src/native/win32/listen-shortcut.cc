#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <chrono>
#include <atomic>
#include <map>
#include <queue>
#include <mutex>
#include "./headers/modifier-names.h"
#include "./headers/key-names.h"

extern std::map<std::string, int> modifier_names;
extern std::map<std::string, int> key_names;

// Structure to hold registration info
struct HotkeyInfo {
    UINT modifiers;
    int vk;
    Napi::ThreadSafeFunction callback;
};

static std::thread* g_printerThread = nullptr;
static std::atomic<bool> g_threadRunning{false};
static std::atomic<bool> g_threadSleeping{true};
static std::atomic<int> g_nextHotkeyId{1};
static std::map<int, Napi::ThreadSafeFunction> g_callbacks;
static std::queue<HotkeyInfo> g_pendingRegistrations;
static std::mutex g_mutex;

// Window procedure
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_HOTKEY) {
        std::cout << "Hotkey pressed! ID: " << wParam << std::endl;
        auto it = g_callbacks.find(wParam);
        if (it != g_callbacks.end()) {
            auto callback = [wParam](Napi::Env env, Napi::Function jsCallback) {
                jsCallback.Call({Napi::Number::New(env, wParam)});
            };
            it->second.NonBlockingCall(callback);
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
    std::cout << "[Thread] Starting message loop" << std::endl;

    // Message loop with periodic callback to keep Node.js alive
    MSG msg = {};
    while (g_threadRunning) {
        // Process all pending messages
        while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }

        // Process any pending registrations
        std::unique_lock<std::mutex> lock(g_mutex);
        while (!g_pendingRegistrations.empty()) {
            auto info = std::move(g_pendingRegistrations.front());
            g_pendingRegistrations.pop();
            lock.unlock();  // Unlock while registering

            int hotkeyId = g_nextHotkeyId++;
            std::cout << "[Thread] Registering hotkey " << hotkeyId 
                     << " - modifiers: 0x" << std::hex << info.modifiers 
                     << ", vk: 0x" << info.vk << std::dec << std::endl;

            if (!RegisterHotKey(hwnd, hotkeyId, info.modifiers, info.vk)) {
                std::cout << "[Thread] Failed to register hotkey. Error: " << GetLastError() << std::endl;
            } else {
                std::cout << "[Thread] Hotkey " << hotkeyId << " registered successfully. Press " 
                         << (info.modifiers & MOD_ALT ? "Alt+" : "") 
                         << (info.modifiers & MOD_CONTROL ? "Ctrl+" : "") 
                         << (info.modifiers & MOD_SHIFT ? "Shift+" : "") 
                         << (info.modifiers & MOD_WIN ? "Win+" : "") 
                         << char(info.vk) << std::endl;

                g_callbacks[hotkeyId] = std::move(info.callback);
            }

            lock.lock();  // Relock for next iteration
        }

        // Sleep a bit to avoid busy loop
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    // Cleanup
    for (const auto& pair : g_callbacks) {
        UnregisterHotKey(hwnd, pair.first);
    }
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
    std::transform(keyStr.begin(), keyStr.end(), keyStr.begin(), ::tolower);
    
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

    // Create ThreadSafeFunction for this hotkey
    auto tsfn = Napi::ThreadSafeFunction::New(
        env,
        info[2].As<Napi::Function>(),
        "Hotkey Thread",
        0,
        1
    );

    int hotkeyId = g_nextHotkeyId.load();  // Get current ID before increment

    // Queue the registration
    {
        std::lock_guard<std::mutex> lock(g_mutex);
        g_pendingRegistrations.push({modifiers, vk, std::move(tsfn)});
    }

    if (g_threadSleeping) {
        g_threadSleeping = false;
    }

    return Napi::Number::New(env, hotkeyId);
}

// Unregister hotkey
Napi::Value UnregisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    int hotkeyId = info[0].As<Napi::Number>().Int32Value();
    
    auto it = g_callbacks.find(hotkeyId);
    if (it != g_callbacks.end()) {
        it->second.Release();
        g_callbacks.erase(it);
    }

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

        // Release all callbacks
        for (auto& pair : g_callbacks) {
            pair.second.Release();
        }
        g_callbacks.clear();
    }
    
    return env.Undefined();
}

// Initialize module
Napi::Object hotkey_init(Napi::Env env, Napi::Object exports) {
    std::cout << "Initializing Windows module..." << std::endl;
    
    // Start the thread
    g_threadRunning = true;
    g_threadSleeping = true;
    g_printerThread = new std::thread(PrinterThread);
    
    exports.Set("registerHotkey", Napi::Function::New(env, RegisterHotkey));
    exports.Set("unregisterHotkey", Napi::Function::New(env, UnregisterHotkey));
    exports.Set("cleanupHotkeys", Napi::Function::New(env, CleanupHotkeys));
    return exports;
}