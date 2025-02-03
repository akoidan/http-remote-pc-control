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
    UINT modifiers;
    UINT key;
};

static std::unordered_map<int, HotkeyContext*> hotkeyContexts;
static int nextHotkeyId = 1;
static HHOOK keyboardHook = NULL;

// Keyboard hook callback
LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0) {
        KBDLLHOOKSTRUCT* kbd = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
        
        // Get current modifier state
        UINT modifiers = 0;
        if (GetAsyncKeyState(VK_MENU) & 0x8000) modifiers |= MOD_ALT;
        if (GetAsyncKeyState(VK_CONTROL) & 0x8000) modifiers |= MOD_CONTROL;
        if (GetAsyncKeyState(VK_SHIFT) & 0x8000) modifiers |= MOD_SHIFT;
        if (GetAsyncKeyState(VK_LWIN) & 0x8000 || GetAsyncKeyState(VK_RWIN) & 0x8000) modifiers |= MOD_WIN;
        
        // Check all registered hotkeys
        for (const auto& pair : hotkeyContexts) {
            HotkeyContext* context = pair.second;
            
            // If modifiers match and the key matches
            if (modifiers == context->modifiers && kbd->vkCode == context->key) {
                auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                    jsCallback.Call({});
                };
                
                context->tsfn.BlockingCall(callback);
            }
        }
    }
    
    return CallNextHookEx(NULL, nCode, wParam, lParam);
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
    UINT vkCode = 0;
    if (keyStr.length() == 1) {
        char c = toupper(keyStr[0]);
        if (c >= 'A' && c <= 'Z') {
            vkCode = c;
        } else if (c >= '0' && c <= '9') {
            vkCode = c;
        }
    } else {
        // Handle special keys
        if (keyStr == "backspace") vkCode = VK_BACK;
        else if (keyStr == "tab") vkCode = VK_TAB;
        else if (keyStr == "return") vkCode = VK_RETURN;
        else if (keyStr == "escape") vkCode = VK_ESCAPE;
        else if (keyStr == "space") vkCode = VK_SPACE;
        else if (keyStr == "pageup") vkCode = VK_PRIOR;
        else if (keyStr == "pagedown") vkCode = VK_NEXT;
        else if (keyStr == "end") vkCode = VK_END;
        else if (keyStr == "home") vkCode = VK_HOME;
        else if (keyStr == "left") vkCode = VK_LEFT;
        else if (keyStr == "up") vkCode = VK_UP;
        else if (keyStr == "right") vkCode = VK_RIGHT;
        else if (keyStr == "down") vkCode = VK_DOWN;
        else if (keyStr == "delete") vkCode = VK_DELETE;
    }

    if (vkCode == 0) {
        Napi::Error::New(env, "Invalid key name").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Convert modifiers array to mask
    Napi::Array modArray = info[1].As<Napi::Array>();
    UINT modifiers = 0;
    for (uint32_t i = 0; i < modArray.Length(); i++) {
        Napi::Value mod = modArray[i];
        if (!mod.IsString()) continue;
        
        std::string modStr = mod.As<Napi::String>().Utf8Value();
        if (modStr == "alt") modifiers |= MOD_ALT;
        else if (modStr == "ctrl") modifiers |= MOD_CONTROL;
        else if (modStr == "shift") modifiers |= MOD_SHIFT;
        else if (modStr == "win") modifiers |= MOD_WIN;
    }

    // Create window for messages if not already created
    HWND hwnd = CreateTestWindow();
    if (!hwnd) {
        Napi::Error::New(env, "Failed to create window").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Create keyboard hook if not already created
    if (!keyboardHook) {
        keyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, NULL, 0);
        if (!keyboardHook) {
            DestroyWindow(hwnd);
            Napi::Error::New(env, "Failed to create keyboard hook").ThrowAsJavaScriptException();
            return env.Null();
        }
    }

    // Create hotkey context
    HotkeyContext* context = new HotkeyContext();
    context->hwnd = hwnd;
    context->modifiers = modifiers;
    context->key = vkCode;
    context->tsfn = Napi::ThreadSafeFunction::New(
        env,
        info[2].As<Napi::Function>(),
        "Hotkey Callback",
        0,
        1
    );

    // Start message thread
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