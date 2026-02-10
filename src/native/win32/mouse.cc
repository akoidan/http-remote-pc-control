#include "./headers/mouse.h"
#include <napi.h>
#include <windows.h>
#include "./headers/logger.h"
#include "headers/validators.h"

#define ABSOLUTE_COORD_CONST 65536


void mouseMove(const Napi::CallbackInfo& info) {
  GET_INT_32_NC(info, 0, nx, size_t);
  GET_INT_32_NC(info, 0, ny, size_t);

  INPUT input = {0};

  // Get virtual screen dimensions
  // int x = GetSystemMetrics(SM_XVIRTUALSCREEN);
  // int y = GetSystemMetrics(SM_YVIRTUALSCREEN);
  int width = GetSystemMetrics(SM_CXVIRTUALSCREEN);
  int height = GetSystemMetrics(SM_CYVIRTUALSCREEN);

  // Ensure point is within bounds
  if (nx < 0) nx = 0;
  if (ny < 0) ny = 0;
  if (nx >= width) nx = width - 1;
  if (ny >= height) ny = height - 1;

  // Convert to absolute coordinates (0-65535)
  input.type = INPUT_MOUSE;
  input.mi.dx = (nx * 65535) / (width - 1);
  input.mi.dy = (ny * 65535) / (height - 1);
  input.mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE | MOUSEEVENTF_VIRTUALDESK;

  SendInput(1, &input, sizeof(INPUT));
}

void toggleMouse(bool down, unsigned int button) {
  INPUT input = {0};
  input.type = INPUT_MOUSE;

  switch (button) {
  case LEFT_BUTTON:
    input.mi.dwFlags = down ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP;
    break;
  case RIGHT_BUTTON:
    input.mi.dwFlags = down ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP;
    break;
  case MIDDLE_BUTTON:
    input.mi.dwFlags = down ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_MIDDLEUP;
    break;
  }

  SendInput(1, &input, sizeof(INPUT));
}


void mouseClick(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  GET_INT_32_NC(info, 0, button, unsigned int);
  if (button < 1 || button > 3) {
    throw Napi::Error::New(env, "Invalid button number.");
  }
  toggleMouse(true, button);
  toggleMouse(false, button);
}

Napi::Object getMousePos(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  POINT point;
  if (!GetCursorPos(&point)) {
    // If GetCursorPos fails, return (0,0)
    throw Napi::Error::New(env, "Unable to get GetCursorPos");
  }

  // Convert to virtual screen coordinates
  int x = GetSystemMetrics(SM_XVIRTUALSCREEN);
  int y = GetSystemMetrics(SM_YVIRTUALSCREEN);

  // Get the virtual screen dimensions
  int width = GetSystemMetrics(SM_CXVIRTUALSCREEN);
  int height = GetSystemMetrics(SM_CYVIRTUALSCREEN);

  // Calculate relative position within virtual screen
  MMPoint pos;
  pos.x = point.x - x;
  pos.y = point.y - y;

  // Ensure the position is within bounds
  if (pos.x < 0) {
    LOG("Cursor pos x=%ld is smaller than 0, setting 0", (long)point.x);
    pos.x = 0;
  }
  if (pos.y < 0) {
    LOG("Cursor pos y=%ld is smaller than 0, setting 0", (long)point.y);
    pos.y = 0;
  }
  if (pos.x >= width) {
    LOG("Cursor pos x=%ld is greater than width %ld, setting %ld", (long)point.y, long(width), long(height - 1));
    pos.x = width - 1;
  }
  if (pos.y >= height) {
    LOG("Cursor pos y=%ld is greater than height %ld, setting %ld", (long)point.y, long(height), long(height - 1));
    pos.y = height - 1;
  }

  Napi::Object obj = Napi::Object::New(env);
  obj.Set("x", Napi::Number::New(env, pos.x));
  obj.Set("y", Napi::Number::New(env, pos.y));
  return obj;
}

Napi::Object mouse_init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "mouseMove"), Napi::Function::New(env, mouseMove));
  exports.Set(Napi::String::New(env, "mouseClick"), Napi::Function::New(env, mouseClick));
  exports.Set(Napi::String::New(env, "getMousePos"), Napi::Function::New(env, getMousePos));
  return exports;
}


// MMPoint CalculateAbsoluteCoordinates(MMPoint point) {
//   RECT screen;
//   GetClientRect(GetDesktopWindow(), &screen);
//   int width = screen.right - screen.left;
//   int height = screen.bottom - screen.top;
//
//   MMPoint absolute;
//   absolute.x = (point.x * ABSOLUTE_COORD_CONST) / width;
//   absolute.y = (point.y * ABSOLUTE_COORD_CONST) / height;
//   return absolute;
// }