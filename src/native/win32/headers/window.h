#pragma once

#include <windows.h>
#include <string>
#include <vector>
#include "napi.h"

struct Process {
  int pid;
  std::string path;
};

// Enumerate windows by process ID
struct EnumWindowsCallbackArgs {
  DWORD processId;
  std::vector<HWND> handles;
};

Napi::Object windowInit(Napi::Env env, Napi::Object exports);
