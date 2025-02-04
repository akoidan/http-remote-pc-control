#include <napi.h>
#include <iostream>
#include <thread>
#include <chrono>
#include <atomic>

static std::thread* g_printerThread = nullptr;
static std::atomic<bool> g_threadRunning{false};
static Napi::ThreadSafeFunction g_tsfn;

void PrinterThread() {
    while (g_threadRunning) {
        std::cout << "hello from windows" << std::endl;
        // Call empty JS callback just to keep Node.js alive
        if (g_tsfn) {
            auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                // Empty callback, just to keep Node.js alive
            };
            g_tsfn.NonBlockingCall(callback);
        }
        std::this_thread::sleep_for(std::chrono::seconds(5));
    }
}

// Register hotkey (just starts the printer thread)
Napi::Value RegisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!g_printerThread) {
        // Create a ThreadSafeFunction that will keep Node.js alive
        g_tsfn = Napi::ThreadSafeFunction::New(
            env,
            Napi::Function::New(env, [](const Napi::CallbackInfo& info) {}),  // Empty function
            "Printer Thread",
            0,  // Unlimited queue
            1   // Only one thread will use this
        );

        g_threadRunning = true;
        g_printerThread = new std::thread(PrinterThread);
    }

    return env.Undefined();
}

// Unregister hotkey (does nothing in this simplified version)
Napi::Value UnregisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return env.Undefined();
}

// Cleanup (stops the printer thread)
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
    exports.Set("registerHotkey", Napi::Function::New(env, RegisterHotkey));
    exports.Set("unregisterHotkey", Napi::Function::New(env, UnregisterHotkey));
    exports.Set("cleanupHotkeys", Napi::Function::New(env, CleanupHotkeys));
    return exports;
}