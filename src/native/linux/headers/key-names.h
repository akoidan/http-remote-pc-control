#pragma once

#include <map>
#include <X11/keysymdef.h>
#include <X11/X.h>

typedef struct {
  const char* name;
  KeySym key;
} KeyNames;

extern KeyNames keyNames[];
extern std::map<char, KeySym> xShiftRequiredMap;
extern std::map<char, KeySym> xSpecialCharacterMap;