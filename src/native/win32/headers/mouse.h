#pragma once

#include <napi.h>
#include <windows.h>

struct MMPoint {
  size_t x;
  size_t y;
};

#define LEFT_BUTTON 1
#define RIGHT_BUTTON 2
#define MIDDLE_BUTTON 3

void moveMouse(MMPoint point);
MMPoint getMousePos();
void toggleMouse(bool down, unsigned int button);
void clickMouse(unsigned int button);
Napi::Object mouse_init(Napi::Env env, Napi::Object exports);
