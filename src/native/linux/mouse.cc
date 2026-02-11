#include "./headers/display.h"
#include "./headers/mouse.h"
#include <napi.h>
#include <X11/extensions/XTest.h>
#include <unistd.h>

#include "headers/validators.h"



Napi::Object getMousePosition(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  int x, y; /* This is all we care about. Seriously. */
  Window garb1, garb2; /* Why you can't specify NULL as a parameter */
  int garb_x, garb_y; /* is beyond me. */
  unsigned int more_garbage;

  Display* display = XGetMainDisplay(env);
  XQueryPointer(display, XDefaultRootWindow(display), &garb1, &garb2, &x, &y, &garb_x, &garb_y, &more_garbage);

  Napi::Object obj = Napi::Object::New(env);
  obj.Set("x", Napi::Number::New(env, x));
  obj.Set("y", Napi::Number::New(env, y));
  return obj;
}


void setMouseButtonToState(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_STRING(info, 0, button);
  GET_BOOL(info, 1, isDown);

  int buttonInt;
  if (button == "LEFT") {
    buttonInt = 1;
  } else if (button == "RIGHT") {
    buttonInt = 2;
  } else if (button == "MIDDLE") {
    buttonInt = 3;
  } else {
    throw Napi::Error::New(env, "Invalid button name. Must be 'LEFT', 'RIGHT', or 'MIDDLE'");
  }
  Display* display = XGetMainDisplay(env);

  if (!XTestFakeButtonEvent(display, buttonInt, isDown ? True : False, CurrentTime)) {
    throw Napi::Error::New(env, "Failed to send XTestFakeMotionEvent");
  }
  if (!XFlush(display)) {
    throw Napi::Error::New(env, "Failed to XFlush");
  }
}

void setMousePosition(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_OBJECT(info, 0, bounds);
  int x = bounds.Get("x").ToNumber().Int32Value();
  int y = bounds.Get("y").ToNumber().Int32Value();

  Display* display = XGetMainDisplay(env);
  int screen = -1;
  if (!XTestFakeMotionEvent(display, screen, x, y, CurrentTime)) {
    throw Napi::Error::New(env, "Failed to send XTestFakeMotionEvent");
  }
  if (!XFlush(display)) {
    throw Napi::Error::New(env, "Failed to XFlush");
  }
}


Napi::Object mouseInit(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "setMousePosition"), Napi::Function::New(env, setMousePosition));
  exports.Set(Napi::String::New(env, "setMouseButtonToState"), Napi::Function::New(env, setMouseButtonToState));
  exports.Set(Napi::String::New(env, "getMousePosition"), Napi::Function::New(env, getMousePosition));
  return exports;
}