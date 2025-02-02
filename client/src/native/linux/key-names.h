//
// Created by andrew on 2/2/25.
//

#ifndef NATIVE_KEY_NAMES_H
#define NATIVE_KEY_NAMES_H

#include <X11/Xutil.h>
#include <X11/XF86keysym.h>

typedef struct {
    const char* name;
    KeySym key;
} KeyNames;

extern KeyNames key_names[];

#endif //NATIVE_KEY_NAMES_H
