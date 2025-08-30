#pragma once

#include <napi.h>

// Helper to extract typed values from N-API callback arguments where
// numeric handles are passed from JS and stored as 64-bit numbers.
// Usage: auto handle = getValueFromCallbackData<HWND>(info, 0);

template <typename T>
inline T getValueFromCallbackData(const Napi::CallbackInfo& info, unsigned handleIndex) {
    return reinterpret_cast<T>(info[handleIndex].As<Napi::Number>().Int64Value());
}
