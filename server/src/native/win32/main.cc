#include <napi.h>
#include "./headers/keypress.h"
#include "./headers/window.h"
#include "./headers/listen-shortcut.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Initialize window management
    window_init(env, exports);
    
    // Initialize keyboard functions
    keyboard_init(env, exports);
    
    // Initialize hotkey manager
    hotkey_init(env, exports);
    
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
