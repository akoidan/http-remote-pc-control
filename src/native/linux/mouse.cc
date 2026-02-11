#include "./headers/display.h"
#include "./headers/mouse.h"
#include <napi.h>
#include <X11/extensions/XTest.h>

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

/**
 * Press down a button, or release it.
 * @param down   True for down, false for up.
 * @param button The button to press down or release.
 */
void toggleMouse(Napi::Env env, bool down, unsigned int button) {
  Display* display = XGetMainDisplay(env);

  if (!XTestFakeButtonEvent(display, button, down ? True : False, CurrentTime)) {
    throw Napi::Error::New(env, "Failed to send XTestFakeMotionEvent");
  }
  if (!XFlush(display)) {
    throw Napi::Error::New(env, "Failed to XFlush");
  }
}


void setMouseButtonToState(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  ASSERT_NUMBER(info, 0)
  unsigned int button = info[0].As<Napi::Number>().Int32Value();
  if (button < 1 || button > 3) {
    throw Napi::Error::New(env, "Invalid button number.");
  }
  toggleMouse(env, true, button);
  toggleMouse(env, false, button);
}

void moveMouse(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  ASSERT_NUMBER(info, 0)
  ASSERT_NUMBER(info, 1)

  int x = info[0].As<Napi::Number>().Int32Value();
  int y = info[1].As<Napi::Number>().Int32Value();
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
  exports.Set(Napi::String::New(env, "setMousePosition"), Napi::Function::New(env, moveMouse));
  exports.Set(Napi::String::New(env, "setMouseButtonToState"), Napi::Function::New(env, setMouseButtonToState));
  exports.Set(Napi::String::New(env, "getMousePosition"), Napi::Function::New(env, getMousePosition));
  return exports;
}