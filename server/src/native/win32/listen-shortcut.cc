#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <atomic>
#include <unordered_map>

const wchar_t* WINDOW_CLASS_NAME = L"HotkeyTestWindow";

struct HotkeyContext {
    std::atomic<bool> running{true};
    Napi::ThreadSafeFunction tsfn;
    std::thread messageThread;
    HWND hwnd;
    int modifiers;
    int key;
};

static std::unordered_map<int, HotkeyContext*> hotkeyContexts;
static int nextHotkeyId = 1;
static HHOOK keyboardHook = NULL;

// Keyboard hook callback
LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        KBDLLHOOKSTRUCT* kbd = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
        
        // Check if Alt is pressed
        bool altPressed = (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
        
        std::cout << "Key event - vkCode: 0x" << std::hex << kbd->vkCode 
                  << " scanCode: 0x" << kbd->scanCode 
                  << " flags: 0x" << kbd->flags 
                  << " Alt pressed: " << (altPressed ? "Yes" : "No") << std::dec << std::endl;
        
        // Check all registered hotkeys
        for (const auto& pair : hotkeyContexts) {
            HotkeyContext* context = pair.second;
            bool modMatch = false;
            
            // Check modifiers
            if (context->modifiers & MOD_ALT) {
                modMatch = altPressed;
            }
            
            // If modifiers match and the key matches
            if (modMatch && kbd->vkCode == context->key) {
                std::cout << "Hotkey match found! Calling callback for ID: " << pair.first << std::endl;
                
                auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                    std::cout << "Executing JavaScript callback" << std::endl;
                    jsCallback.Call({});
                };
                
                context->tsfn.BlockingCall(callback);
            }
        }
    }
    return CallNextHookEx(keyboardHook, nCode, wParam, lParam);
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
        case WM_HOTKEY: {
            std::cout << "WM_HOTKEY received in WindowProc - ID: " << wParam << std::endl;
            auto it = hotkeyContexts.find(static_cast<int>(wParam));
            if (it != hotkeyContexts.end()) {
                auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                    jsCallback.Call({});
                };
                it->second->tsfn.BlockingCall(callback);
            }
            return 0;
        }
            
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

HWND CreateTestWindow() {
    std::cout << "Creating test window..." << std::endl;
    
    WNDCLASSEXW wc = {};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = WINDOW_CLASS_NAME;
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    
    if (!RegisterClassExW(&wc)) {
        std::cout << "Failed to register window class. Error: " << GetLastError() << std::endl;
        return NULL;
    }
    
    HWND hwnd = CreateWindowExW(
        0,
        WINDOW_CLASS_NAME,
        L"Hotkey Test Window",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT,
        400, 300,
        NULL,
        NULL,
        GetModuleHandle(NULL),
        NULL
    );
    
    if (hwnd == NULL) {
        std::cout << "Failed to create window. Error: " << GetLastError() << std::endl;
    } else {
        std::cout << "Test window created successfully" << std::endl;
        ShowWindow(hwnd, SW_SHOWMINIMIZED);
        UpdateWindow(hwnd);
    }
    
    return hwnd;
}

void MessageLoop(HotkeyContext* context) {
    std::cout << "Message loop started in thread: " << std::this_thread::get_id() << std::endl;
    
    context->hwnd = CreateTestWindow();
    if (!context->hwnd) {
        std::cout << "Failed to create test window, message loop exiting" << std::endl;
        return;
    }
    
    // Install keyboard hook if not already installed
    if (!keyboardHook) {
        keyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, GetModuleHandle(NULL), 0);
        if (!keyboardHook) {
            std::cout << "Failed to install keyboard hook. Error: " << GetLastError() << std::endl;
        } else {
            std::cout << "Keyboard hook installed successfully" << std::endl;
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
    
    std::cout << "Message loop ended" << std::endl;
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

    std::cout << "Registering hotkey with details:" << std::endl;
    std::cout << "  ID: " << hotkeyId << std::endl;
    std::cout << "  Modifiers (hex): 0x" << std::hex << modifiers << std::dec << std::endl;
    std::cout << "  Key (hex): 0x" << std::hex << key << std::dec << std::endl;
    std::cout << "  Alt flag: " << ((modifiers & MOD_ALT) ? "Yes" : "No") << std::endl;
    std::cout << "  Ctrl flag: " << ((modifiers & MOD_CONTROL) ? "Yes" : "No") << std::endl;
    std::cout << "  Shift flag: " << ((modifiers & MOD_SHIFT) ? "Yes" : "No") << std::endl;
    std::cout << "  Win flag: " << ((modifiers & MOD_WIN) ? "Yes" : "No") << std::endl;

    auto context = new HotkeyContext();
    context->modifiers = modifiers;
    context->key = key;
    
    std::cout << "Creating thread-safe function wrapper for JavaScript callback" << std::endl;
    context->tsfn = Napi::ThreadSafeFunction::New(
        env,
        callback,
        "Hotkey Callback",
        0,
        1
    );

    std::cout << "Starting message loop thread" << std::endl;
    context->messageThread = std::thread(MessageLoop, context);
    hotkeyContexts[hotkeyId] = context;
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    // Try both registration methods
    if (!RegisterHotKey(NULL, hotkeyId, modifiers, key)) {
        DWORD error = GetLastError();
        std::cout << "Failed to register global hotkey. Error: " << error << std::endl;
        
        if (!RegisterHotKey(context->hwnd, hotkeyId, modifiers, key)) {
            error = GetLastError();
            std::cout << "Failed to register window hotkey. Error: " << error << std::endl;
        }
    }

    std::cout << "Hotkey registration complete - ID: " << hotkeyId << std::endl;
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
        UnregisterHotKey(context->hwnd, hotkeyId);
        
        PostThreadMessage(GetThreadId(context->messageThread.native_handle()), WM_QUIT, 0, 0);
        
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

    // Remove keyboard hook
    if (keyboardHook) {
        UnhookWindowsHookEx(keyboardHook);
        keyboardHook = NULL;
    }

    for (auto& pair : hotkeyContexts) {
        HotkeyContext* context = pair.second;
        context->running = false;
        UnregisterHotKey(NULL, pair.first);
        UnregisterHotKey(context->hwnd, pair.first);
        
        PostThreadMessage(GetThreadId(context->messageThread.native_handle()), WM_QUIT, 0, 0);
        
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