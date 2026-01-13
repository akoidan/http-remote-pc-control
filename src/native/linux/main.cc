#include <napi.h>
#include "./headers/window.h"
#include "./headers/keypress.h"
#include "./headers/mouse.h"


Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Initialize window management
  window_init(env, exports);
  keyboard_init(env, exports);
  init_mouse(env, exports);

  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)