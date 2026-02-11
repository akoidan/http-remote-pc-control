#include <napi.h>
#include "./headers/window.h"
#include "./headers/keypress.h"
#include "./headers/mouse.h"
#include "./headers/monitor.h"
#include "./headers/process.h"

Napi::Object init(Napi::Env env, Napi::Object exports) {
  windowInit(env, exports);
  keyboardInit(env, exports);
  mouseInit(env, exports);
  monitorInit(env, exports);
  processInit(env, exports);

  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, init)