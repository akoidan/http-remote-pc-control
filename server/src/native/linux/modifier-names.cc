#include <map>
#include <string>
#include <X11/Xlib.h>

std::map<std::string, int> modifier_names = {
    {"alt", Mod1Mask},
    {"control", ControlMask},
    {"ctrl", ControlMask},
    {"shift", ShiftMask},
    {"win", Mod4Mask},
    {"meta", Mod4Mask},
    {"cmd", Mod4Mask},
    {"super", Mod4Mask},
    {"left_alt", Mod1Mask},
    {"right_alt", Mod1Mask}
};
