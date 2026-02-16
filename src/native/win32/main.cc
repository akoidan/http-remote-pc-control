#include <napi.h>
#include "./headers/keypress.h"
#include "./headers/window.h"
#include "./headers/mouse.h"
#include "./headers/monitor.h"
#include "./headers/process.h"

Napi::Object init(Napi::Env env, Napi::Object exports) {
  // Initialize window management
  windowInit(env, exports);

  // Initialize keyboard functions
  keyboardInit(env, exports);

  // Initialize mouse functions
  mouseInit(env, exports);

  // Initialize monitor functions
  monitorInit(env, exports);

  // Initialize process functions
  processInit(env, exports);

  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, init)