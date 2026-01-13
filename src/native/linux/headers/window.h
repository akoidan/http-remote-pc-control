#pragma once

#include "napi.h"
#include <xcb/xcb_ewmh.h>

struct WindowInfo {
  xcb_window_t id;
  pid_t pid;
};

Napi::Object window_init(Napi::Env env, Napi::Object exports);