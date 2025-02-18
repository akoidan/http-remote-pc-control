#pragma once
#include "napi.h"
Napi::Object init_mouse(Napi::Env env, Napi::Object exports);

struct MMPoint {
    int64_t x;
    int64_t y;
};

enum MMMouseButton {
    LEFT_BUTTON = 1,
    CENTER_BUTTON = 2,
    RIGHT_BUTTON = 3
};
