#pragma once

#include <napi.h>

std::string getProcessPath(pid_t pid, Napi::Env env);

Napi::Object processInit(Napi::Env env, Napi::Object exports);