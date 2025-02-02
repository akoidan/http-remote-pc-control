//
// Created by andrew on 2/2/25.
//
#include <X11/extensions/XTest.h>
#ifndef NATIVE_DISPLAY_H
#define NATIVE_DISPLAY_H

void XCloseMainDisplay(void);

Display *XGetMainDisplay(void);

#endif //NATIVE_DISPLAY_H
