#ifndef NATIVE_DISPLAY_H
#define NATIVE_DISPLAY_H
#include <X11/extensions/XTest.h>

void XCloseMainDisplay();

Display *XGetMainDisplay();

#endif
