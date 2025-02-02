#include <napi.h>
#include "./window.h"
#include "./keypress.h"


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Initialize window management
    window_init(env, exports);
    keyboard_init(env, exports);

    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
