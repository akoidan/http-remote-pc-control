#pragma once
#include <napi.h>
#include <X11/Xlib.h>

void XCloseMainDisplay();

Display* XGetMainDisplay(Napi::Env);