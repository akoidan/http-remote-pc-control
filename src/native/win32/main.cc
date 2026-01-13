#include <napi.h>
#include "./headers/keypress.h"
#include "./headers/window.h"
#include "./headers/mouse.h"
#include "./headers/monitor.h"
#include "./headers/process.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Initialize window management
  window_init(env, exports);

  // Initialize keyboard functions
  keyboard_init(env, exports);

  // Initialize mouse functions
  mouse_init(env, exports);

  // Initialize monitor functions
  monitor_init(env, exports);

  // Initialize process functions
  process_init(env, exports);

  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)