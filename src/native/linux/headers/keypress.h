#pragma once

#include "napi.h"

Napi::Object keyboard_init(Napi::Env env, Napi::Object exports);

// Set keyboard layout by layout ID (e.g., "us" for US English, "ru" for Russian)
Napi::Value SetKeyboardLayout(const Napi::CallbackInfo& info);