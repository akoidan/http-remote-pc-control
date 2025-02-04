#include <windows.h>
#include <map>
#include <string>
#include "./headers/modifier-names.h"

std::map<std::string, int> modifier_names = {
    {"alt", MOD_ALT | MOD_NOREPEAT},
    {"control", MOD_CONTROL | MOD_NOREPEAT},
    {"ctrl", MOD_CONTROL | MOD_NOREPEAT},
    {"shift", MOD_SHIFT | MOD_NOREPEAT},
    {"win", MOD_WIN | MOD_NOREPEAT},
    {"meta", MOD_WIN | MOD_NOREPEAT},
    {"cmd", MOD_WIN | MOD_NOREPEAT},
    {"super", MOD_WIN | MOD_NOREPEAT},
    {"left_alt", MOD_ALT | MOD_NOREPEAT},
    {"right_alt", MOD_ALT | MOD_NOREPEAT}
};
