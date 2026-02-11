#include <napi.h>
#include "./headers/monitor.h"
#include <X11/Xlib.h>

// Minimal Linux monitor implementation providing API parity with win32
// This basic version reports a single primary monitor using the default screen.
// getMonitorScaleFactor returns 1.0 as a conservative default (no per-monitor scaling).


static Napi::Object getMonitorInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    Display* display = XOpenDisplay(nullptr);
    if (!display) {
        // Fallback to 1920x1080 if X display is unavailable
        throw Napi::Error::New(env, "Monitor handle is null or invalid");
    }

    int screen = DefaultScreen(display);
    int width = DisplayWidth(display, screen);
    int height = DisplayHeight(display, screen);

    Napi::Object bounds = Napi::Object::New(env);
    bounds.Set("x", 0);
    bounds.Set("y", 0);
    bounds.Set("width", width);
    bounds.Set("height", height);

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("bounds", bounds);
    obj.Set("workArea", bounds); // No EWMH work area support in this minimal version
    obj.Set("isPrimary", true);
    obj.Set("scale", 1);

    XCloseDisplay(display);
    return obj;
}

Napi::Object monitorInit(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getMonitorInfo"), Napi::Function::New(env, getMonitorInfo));
    return exports;
}
