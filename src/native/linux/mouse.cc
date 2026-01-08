#include "./headers/display.h"
#include "./headers/mouse.h"
#include <napi.h>
#include <X11/extensions/XTest.h>

/**
 * Move the mouse to a specific point.
 * @param point The coordinates to move the mouse to (x, y).
 */
void moveMouse(MMPoint point) {
    Display *display = XGetMainDisplay();
    int screen = -1;
    XTestFakeMotionEvent(display, screen, point.x, point.y, CurrentTime);
    XFlush(display);
}

MMPoint getMousePos() {
    int x, y;			 /* This is all we care about. Seriously. */
    Window garb1, garb2; /* Why you can't specify NULL as a parameter */
    int garb_x, garb_y;	 /* is beyond me. */
    unsigned int more_garbage;

    Display *display = XGetMainDisplay();
    XQueryPointer(display, XDefaultRootWindow(display), &garb1, &garb2, &x, &y, &garb_x, &garb_y, &more_garbage);

    MMPoint point;
    point.x = x;
    point.y = y;
    return point;
}


Napi::Object _getMousePos(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    MMPoint p = getMousePos();
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("x", Napi::Number::New(env, p.x));
    obj.Set("y", Napi::Number::New(env, p.y));
    return obj;
}

/**
 * Press down a button, or release it.
 * @param down   True for down, false for up.
 * @param button The button to press down or release.
 */
void toggleMouse(bool down, unsigned int button)
{
    Display *display = XGetMainDisplay();
    XTestFakeButtonEvent(display, button, down ? True : False, CurrentTime);
    XFlush(display);
}

void clickMouse(unsigned int button)
{
    toggleMouse(true, button);
    toggleMouse(false, button);
}

Napi::Value _mouseClick(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    clickMouse(LEFT_BUTTON);
    return env.Undefined();
}

Napi::Number _moveMouse(const Napi::CallbackInfo &info) {
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
    return Napi::Number::New(env, LEFT_BUTTON);
}


Napi::Object init_mouse(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "mouseMove"), Napi::Function::New(env, _moveMouse));
    exports.Set(Napi::String::New(env, "mouseClick"), Napi::Function::New(env, _mouseClick));
    exports.Set(Napi::String::New(env, "getMousePos"), Napi::Function::New(env, _getMousePos));
    return exports;
}
