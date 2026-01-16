#include <cmath>
#include <cstdint>
#include <iostream>
#include <napi.h>
#include <shtypes.h>
#include <string>
#include <windows.h>
#include "./headers/logger.h"

Napi::Number createProcess(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto path = info[0].ToString().Utf8Value();

  std::string cmd = "";

  if (info[1].IsString()) {
    cmd = info[1].ToString().Utf8Value();
  }

  STARTUPINFOA sInfo = {sizeof (sInfo)};
  PROCESS_INFORMATION processInfo;
  CreateProcessA(path.c_str(), &cmd[0], NULL, NULL, FALSE,
                 CREATE_NEW_PROCESS_GROUP | CREATE_NEW_CONSOLE, NULL, NULL, &sInfo, &processInfo);

  return Napi::Number::New(env, processInfo.dwProcessId);
}

Napi::Boolean isProcessElevated(const Napi::CallbackInfo& info) {
    Napi::Env env{info.Env()};
    HANDLE hToken = nullptr;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &hToken)) {
        return Napi::Boolean::New(env, false);
    }

    TOKEN_ELEVATION elevation;
    DWORD retLen = 0;
    if (!GetTokenInformation(hToken, TokenElevation, &elevation, sizeof(elevation), &retLen)) {
        CloseHandle(hToken);
        return Napi::Boolean::New(env, false);
    }

    CloseHandle(hToken);
    return Napi::Boolean::New(env, elevation.TokenIsElevated != 0);
}

Napi::Object process_init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "createProcess"), Napi::Function::New(env, createProcess));
  exports.Set(Napi::String::New(env, "isProcessElevated"), Napi::Function::New(env, isProcessElevated));
  return exports;
}