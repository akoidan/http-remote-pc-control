#pragma once
#include <napi.h>
#include <X11/Xlib.h>

void xCloseMainDisplay();

Display* xGetMainDisplay(Napi::Env);