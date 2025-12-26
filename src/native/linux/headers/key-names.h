#pragma once


#include <map>
#include <X11/keysymdef.h>
#include <X11/X.h>

typedef struct {
    const char* name;
    KeySym key;
} KeyNames;

extern KeyNames key_names[];
extern std::map<char, KeySym> XShiftRequiredMap;
extern std::map<char, KeySym> XSpecialCharacterMap;
