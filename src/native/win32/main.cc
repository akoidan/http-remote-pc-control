#include <napi.h>
#include "./headers/keypress.h"
#include "./headers/window.h"
#include "./headers/mouse.h"
#include "./headers/monitor.h"
#include "./headers/process.h"
#include "./headers/logger.h"
#include <windows.h>

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

  HANDLE hStdin = GetStdHandle(STD_INPUT_HANDLE);
  if (hStdin == INVALID_HANDLE_VALUE) {
    LOG("Failed to disable QuickEdit since GetStdHandle failed");
    return exports;
  }

  DWORD mode = 0;
  if (!GetConsoleMode(hStdin, &mode)) {
    LOG("Failed to disable QuickEdit since GetConsoleMode failed");
    return exports;
  }

  mode &= ~ENABLE_QUICK_EDIT_MODE;
  mode &= ~ENABLE_INSERT_MODE;
  mode |= ENABLE_EXTENDED_FLAGS;

  if (!SetConsoleMode(hStdin, mode)) {
    LOG("Failed to disable QuickEdit since SetConsoleMode failed");
    return exports;
  }
  LOG("Successfully disabled QuickEdit");
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, init)