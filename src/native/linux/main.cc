#include <napi.h>
#include "./headers/window.h"
#include "./headers/keypress.h"
#include "./headers/mouse.h"
#include "./headers/monitor.h"
#include "./headers/process.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    window_init(env, exports);
    keyboard_init(env, exports);
    mouse_init(env, exports);
    monitor_init(env, exports);
    process_init(env, exports);

    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
