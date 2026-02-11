#pragma once

#include <napi.h>
std::string getProcessPath(pid_t pid, Napi::Env env);

Napi::Object process_init(Napi::Env env, Napi::Object exports);
