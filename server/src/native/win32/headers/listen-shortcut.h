#pragma once
#include <napi.h>

Napi::Value RegisterHotkey(const Napi::CallbackInfo& info);
Napi::Value UnregisterHotkey(const Napi::CallbackInfo& info);
Napi::Value CleanupHotkeys(const Napi::CallbackInfo& info);
Napi::Object hotkey_init(Napi::Env env, Napi::Object exports);
