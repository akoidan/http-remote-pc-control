#pragma once

#include <napi.h>
#include <windows.h>

#define LEFT_BUTTON 1
#define RIGHT_BUTTON 2
#define MIDDLE_BUTTON 3

Napi::Object mouseInit(Napi::Env env, Napi::Object exports);
