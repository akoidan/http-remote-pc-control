#pragma once

#include "napi.h"

// Modifier flags and their corresponding virtual keys
struct KeyModifier {
    const char* name;      // Name in JS API
    unsigned int flag;     // Internal flag value
    int vkey;             // Windows virtual key code
    int winBit;           // Windows modifier bit
};

Napi::Object keyboard_init(Napi::Env env, Napi::Object exports);