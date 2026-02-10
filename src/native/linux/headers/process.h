#pragma once

#include <napi.h>
std::string get_process_path(pid_t pid, Napi::Env env);

Napi::Object processInit(Napi::Env env, Napi::Object exports);
