#pragma once

#include "napi.h"

struct Process {
  int pid;
  std::string path;
};

Napi::Object window_init(Napi::Env env, Napi::Object exports);
