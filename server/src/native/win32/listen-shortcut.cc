#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <chrono>
#include <atomic>
#include <map>
#include <condition_variable>
#include "./headers/modifier-names.h"
#include "./headers/key-names.h"

extern std::map<std::string, int> modifier_names;
extern std::map<std::string, int> key_names;

// Structure for registration request
struct RegistrationRequest {
    UINT modifiers;
    int vk;
    Napi::ThreadSafeFunction callback;
    bool pending = true;
    bool success = false;
    int hotkeyId = -1;
    std::string errorMessage;  // Added field for error message
};

static std::thread* g_printerThread = nullptr;
static std::atomic<bool> g_threadRunning{false};
static std::atomic<int> g_nextHotkeyId{1};
static std::map<int, Napi::ThreadSafeFunction> g_callbacks;
static HWND g_hwnd = NULL;

// Synchronization
static std::mutex g_mutex;
static std::condition_variable g_printerCV;  // For printer thread to wait for requests
static std::condition_variable g_mainCV;     // For main thread to wait for results
static RegistrationRequest* g_currentRequest = nullptr;

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

    g_hwnd = hwnd;
    std::cout << "[Thread] Window created: " << std::hex << hwnd << std::dec << std::endl;

    // Message loop with registration handling
    MSG msg = {};
    while (g_threadRunning) {
        // Wait for registration request or messages
        {
            std::unique_lock<std::mutex> lock(g_mutex);
            while (!g_currentRequest && g_threadRunning) {
                // Process any pending messages while waiting
                while (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
                    TranslateMessage(&msg);
                    DispatchMessage(&msg);
                }
                
                // Wait with timeout to allow message processing
                g_printerCV.wait_for(lock, std::chrono::milliseconds(100));
            }

            if (!g_threadRunning) break;

            // Process registration request
            if (g_currentRequest) {
                std::cout << "[Thread] Processing registration - modifiers: 0x" << std::hex 
                         << g_currentRequest->modifiers << ", vk: 0x" << g_currentRequest->vk 
                         << std::dec << std::endl;

                int hotkeyId = g_nextHotkeyId++;
                bool success = RegisterHotKey(hwnd, hotkeyId, g_currentRequest->modifiers, g_currentRequest->vk);

                if (!success) {
                    DWORD error = GetLastError();
                    
                    if (error == ERROR_HOTKEY_ALREADY_REGISTERED) {
                        g_currentRequest->errorMessage = "Hotkey is already registered by another application";
                    } else {
                        g_currentRequest->errorMessage = "Failed to register hotkey. Error code: " + std::to_string(error);
                    }
                    
                    std::cout << "[Thread] " << g_currentRequest->errorMessage << std::endl;
                } else {
                    std::cout << "[Thread] Hotkey " << hotkeyId << " registered successfully. Press " 
                             << (g_currentRequest->modifiers & MOD_ALT ? "Alt+" : "") 
                             << (g_currentRequest->modifiers & MOD_CONTROL ? "Ctrl+" : "") 
                             << (g_currentRequest->modifiers & MOD_SHIFT ? "Shift+" : "") 
                             << (g_currentRequest->modifiers & MOD_WIN ? "Win+" : "") 
                             << char(g_currentRequest->vk) << std::endl;

                    g_callbacks[hotkeyId] = std::move(g_currentRequest->callback);
                }

                // Store result
                g_currentRequest->success = success;
                g_currentRequest->hotkeyId = success ? hotkeyId : -1;
                g_currentRequest->pending = false;

                // Notify main thread
                g_mainCV.notify_one();
                
                // Clear current request
                g_currentRequest = nullptr;
            }
        }
    }

    // Cleanup
    for (const auto& pair : g_callbacks) {
        UnregisterHotKey(hwnd, pair.first);
    }
    DestroyWindow(hwnd);
    UnregisterClassW(CLASS_NAME, GetModuleHandle(NULL));
    g_hwnd = NULL;
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

    // Create registration request
    RegistrationRequest request;
    request.modifiers = modifiers;
    request.vk = vk;
    request.callback = std::move(tsfn);
    request.pending = true;
    request.success = false;
    request.hotkeyId = -1;

    std::string errorMessage;
    // Send request to printer thread and wait for result
    {
        std::unique_lock<std::mutex> lock(g_mutex);
        
        // Check if printer thread is running
        if (!g_threadRunning || !g_hwnd) {
            errorMessage = "Hotkey registration system is not initialized";
            request.callback.Release();
            Napi::Error::New(env, errorMessage).ThrowAsJavaScriptException();
            return env.Null();
        }
        
        g_currentRequest = &request;
        g_printerCV.notify_one();

        // Wait for result with timeout
        if (!g_mainCV.wait_for(lock, std::chrono::seconds(5), [&request]() { return !request.pending; })) {
            // Timeout occurred
            g_currentRequest = nullptr;  // Clear the request
            request.callback.Release();
            errorMessage = "Hotkey registration timed out";
            Napi::Error::New(env, errorMessage).ThrowAsJavaScriptException();
            return env.Null();
        }
    }

    // Return result
    if (!request.success) {
        request.callback.Release();
        Napi::Error::New(env, request.errorMessage.empty() ? "Failed to register hotkey" : request.errorMessage)
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Number::New(env, request.hotkeyId);
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

    if (g_hwnd) {
        UnregisterHotKey(g_hwnd, hotkeyId);
    }

    return env.Undefined();
}

// Cleanup
Napi::Value CleanupHotkeys(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_printerThread) {
        g_threadRunning = false;
        g_printerCV.notify_one();  // Wake up thread if it's waiting
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
    g_printerThread = new std::thread(PrinterThread);
    
    exports.Set("registerHotkey", Napi::Function::New(env, RegisterHotkey));
    exports.Set("unregisterHotkey", Napi::Function::New(env, UnregisterHotkey));
    exports.Set("cleanupHotkeys", Napi::Function::New(env, CleanupHotkeys));
    return exports;
}