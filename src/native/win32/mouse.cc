#include "./headers/mouse.h"
#include <napi.h>
#include <windows.h>
#include "./headers/logger.h"

#define ABSOLUTE_COORD_CONST 65536

MMPoint CalculateAbsoluteCoordinates(MMPoint point) {
  RECT screen;
  GetClientRect(GetDesktopWindow(), &screen);
  int width = screen.right - screen.left;
  int height = screen.bottom - screen.top;

  MMPoint absolute;
  absolute.x = (point.x * ABSOLUTE_COORD_CONST) / width;
  absolute.y = (point.y * ABSOLUTE_COORD_CONST) / height;
  return absolute;
}

void moveMouse(MMPoint point) {
  INPUT input = {0};

  // Get virtual screen dimensions
  int x = GetSystemMetrics(SM_XVIRTUALSCREEN);
  int y = GetSystemMetrics(SM_YVIRTUALSCREEN);
  int width = GetSystemMetrics(SM_CXVIRTUALSCREEN);
  int height = GetSystemMetrics(SM_CYVIRTUALSCREEN);

  // Ensure point is within bounds
  if (point.x < 0) point.x = 0;
  if (point.y < 0) point.y = 0;
  if (point.x >= width) point.x = width - 1;
  if (point.y >= height) point.y = height - 1;

  // Convert to absolute coordinates (0-65535)
  input.type = INPUT_MOUSE;
  input.mi.dx = (point.x * 65535) / (width - 1);
  input.mi.dy = (point.y * 65535) / (height - 1);
  input.mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE | MOUSEEVENTF_VIRTUALDESK;

  SendInput(1, &input, sizeof(INPUT));
}

MMPoint getMousePos(Napi::Env env) {
  POINT point;
  if (!GetCursorPos(&point)) {
    // If GetCursorPos fails, return (0,0)
    throw Napi::Error::New(env, "Invalid number of arguments.");
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

  return pos;
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

void clickMouse(unsigned int button) {
  POINT p;
  GetCursorPos(&p);
  const char* btn = (button == LEFT_BUTTON ? "left" : (button == RIGHT_BUTTON ? "right" : "middle"));
  LOG("mouse click button=%s at (%ld,%ld)", btn, (long)p.x, (long)p.y);
  toggleMouse(true, button);
  toggleMouse(false, button);
}

void _mouseClick(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  clickMouse(LEFT_BUTTON);
}

void _moveMouse(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2) {
    throw Napi::Error::New(env, "Invalid number of arguments.");
  }

  size_t x = info[0].As<Napi::Number>().Int32Value();
  size_t y = info[1].As<Napi::Number>().Int32Value();

  MMPoint point;
  point.x = x;
  point.y = y;
  moveMouse(point);
}

Napi::Object _getMousePos(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  MMPoint p = getMousePos(env);
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("x", Napi::Number::New(env, p.x));
  obj.Set("y", Napi::Number::New(env, p.y));
  return obj;
}

Napi::Object mouse_init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "mouseMove"), Napi::Function::New(env, _moveMouse));
  exports.Set(Napi::String::New(env, "mouseClick"), Napi::Function::New(env, _mouseClick));
  exports.Set(Napi::String::New(env, "getMousePos"), Napi::Function::New(env, _getMousePos));
  return exports;
}