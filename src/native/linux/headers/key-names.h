#pragma once

#include <X11/Xutil.h>
#include <X11/XF86keysym.h>
#include <map>

typedef struct {
    const char* name;
    KeySym key;
} KeyNames;

extern KeyNames key_names[];
extern std::map<char, KeySym> XShiftRequiredMap;
extern std::map<char, KeySym> XSpecialCharacterMap;
