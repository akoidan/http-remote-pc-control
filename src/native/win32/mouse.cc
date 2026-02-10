#include "./headers/mouse.h"
#include <napi.h>
#include <windows.h>
#include "./headers/logger.h"
#include "./headers/validators.h"

#define ABSOLUTE_COORD_CONST 65536


void setMousePosition(const Napi::CallbackInfo& info) {
  GET_OBJECT(info, 0, bounds);
  size_t nx = bounds.Get("x").ToNumber().Int32Value();
  size_t ny = bounds.Get("y").ToNumber().Int32Value();

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


void setMouseButtonToState(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  GET_INT_32_NC(info, 0, button, unsigned int);
  GET_BOOL(info, 1, isDown);
  if (button < 1 || button > 3) {
    throw Napi::Error::New(env, "Invalid button number.");
  }

  toggleMouse(isDown, button);
}

Napi::Object getMousePosition(const Napi::CallbackInfo& info) {
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
  size_t rx = point.x - x;
  size_t ry = point.y - y;

  // Ensure the position is within bounds
  if (rx < 0) {
    LOG("Cursor pos x=%ld is smaller than 0, setting 0", (long)point.x);
    rx = 0;
  }
  if (ry < 0) {
    LOG("Cursor pos y=%ld is smaller than 0, setting 0", (long)point.y);
    ry = 0;
  }
  if (rx >= width) {
    LOG("Cursor pos x=%ld is greater than width %ld, setting %ld", (long)point.y, long(width), long(height - 1));
    rx = width - 1;
  }
  if (ry >= height) {
    LOG("Cursor pos y=%ld is greater than height %ld, setting %ld", (long)point.y, long(height), long(height - 1));
    ry = height - 1;
  }

  Napi::Object obj = Napi::Object::New(env);
  obj.Set("x", Napi::Number::New(env, rx));
  obj.Set("y", Napi::Number::New(env, ry));
  return obj;
}

Napi::Object mouse_init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "setMousePosition"), Napi::Function::New(env, setMousePosition));
  exports.Set(Napi::String::New(env, "setMouseButtonToState"), Napi::Function::New(env, setMouseButtonToState));
  exports.Set(Napi::String::New(env, "getMousePosition"), Napi::Function::New(env, getMousePosition));
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