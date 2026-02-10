#include <napi.h>
#include "./headers/keypress.h"
#include "./headers/window.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Initialize window management
  windowInit(env, exports);

  // Initialize keyboard functions
  keyboardInit(env, exports);
  mouseInit(env, exports);

  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)