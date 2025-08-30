#include <napi.h>
#include "./headers/keypress.h"
#include "./headers/window.h"
#include "./headers/mouse.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Initialize window management
    window_init(env, exports);
    
    // Initialize keyboard functions
    keyboard_init(env, exports);
    
    // Initialize mouse functions
    init_mouse(env, exports);

    process_init(env, exports);

    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
