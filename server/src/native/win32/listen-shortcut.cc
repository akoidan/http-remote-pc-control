#include <napi.h>
#include <windows.h>
#include <iostream>
#include <thread>
#include <atomic>
#include <unordered_map>

const wchar_t* WINDOW_CLASS_NAME = L"HotkeyMessageWindow";

struct HotkeyContext {
    std::atomic<bool> running{true};
    HWND hwnd;
    int modifiers;
    int key;
    std::thread messageThread;
    Napi::Reference<Napi::Value> ref; // Keep Node.js alive
};

static std::unordered_map<int, HotkeyContext*> hotkeyContexts;
static int nextHotkeyId = 1;

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_HOTKEY) {
        int hotkeyId = static_cast<int>(wParam);
        std::cout << "HOTKEY PRESSED! ID: " << hotkeyId << std::endl;
        auto it = hotkeyContexts.find(hotkeyId);
        if (it != hotkeyContexts.end()) {
            std::cout << "Found registered hotkey with modifiers: 0x" << std::hex << it->second->modifiers 
                      << " key: 0x" << it->second->key << std::dec << std::endl;
            return 0;
        }
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

HWND CreateMessageWindow() {
    std::cout << "Creating message window..." << std::endl;
    
    WNDCLASSEXW wc = {};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = WINDOW_CLASS_NAME;
    
    if (!RegisterClassExW(&wc)) {
        std::cout << "Failed to register window class. Error: " << GetLastError() << std::endl;
        return NULL;
    }
    
    // Create a message-only window
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
    } else {
        std::cout << "Message window created successfully" << std::endl;
    }
    
    return hwnd;
}

void MessageLoop(HotkeyContext* context) {
    std::cout << "Message loop started" << std::endl;
    
    context->hwnd = CreateMessageWindow();
    if (!context->hwnd) {
        std::cout << "Failed to create message window, message loop exiting" << std::endl;
        return;
    }
    
    // Try registering with NULL first (global)
    int hotkeyId = nextHotkeyId - 1; // Get current hotkey ID
    if (!RegisterHotKey(NULL, hotkeyId, context->modifiers, context->key)) {
        DWORD error = GetLastError();
        std::cout << "Failed to register global hotkey. Error: " << error << std::endl;
        
        // If global fails, try with our window
        if (!RegisterHotKey(context->hwnd, hotkeyId, context->modifiers, context->key)) {
            error = GetLastError();
            std::cout << "Failed to register window hotkey. Error: " << error << std::endl;
            return;
        }
    }
    
    std::cout << "Hotkey registered successfully - ID: " << hotkeyId << std::endl;
    std::cout << "Modifiers: 0x" << std::hex << context->modifiers << std::dec << std::endl;
    std::cout << "Key: 0x" << std::hex << context->key << std::dec << std::endl;
    
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

    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Wrong arguments: expected (modifiers, key)").ThrowAsJavaScriptException();
        return env.Null();
    }

    int modifiers = info[0].As<Napi::Number>().Int32Value();
    int key = info[1].As<Napi::Number>().Int32Value();
    
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
    
    // Create a reference to keep Node.js alive
    std::cout << "Creating Node.js reference to keep process alive..." << std::endl;
    context->ref = Napi::Reference<Napi::Value>::New(env.Global(), 1);
    std::cout << "Node.js reference created successfully" << std::endl;
    
    std::cout << "Starting message loop thread" << std::endl;
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
        if (context->hwnd) {
            UnregisterHotKey(context->hwnd, hotkeyId);
            PostMessage(context->hwnd, WM_QUIT, 0, 0);
        }
        
        if (context->messageThread.joinable()) {
            std::cout << "Waiting for message loop thread to finish..." << std::endl;
            context->messageThread.join();
            std::cout << "Message loop thread finished" << std::endl;
        }
        
        std::cout << "Removing Node.js reference..." << std::endl;
        context->ref.Unref();
        std::cout << "Node.js reference removed" << std::endl;
        
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
            std::cout << "Waiting for message loop thread to finish..." << std::endl;
            context->messageThread.join();
            std::cout << "Message loop thread finished" << std::endl;
        }
        
        std::cout << "Removing Node.js reference..." << std::endl;
        context->ref.Unref();
        std::cout << "Node.js reference removed" << std::endl;
        
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