#include <napi.h>
#include "./headers/listen-shortcut.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Initialize hotkey manager
    hotkey_init(env, exports);
    
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
