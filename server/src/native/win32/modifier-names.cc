#include <windows.h>
#include <map>
#include <string>
#include "./headers/modifier-names.h"

std::map<std::string, int> modifier_names = {
    {"alt", MOD_ALT},
    {"control", MOD_CONTROL},
    {"ctrl", MOD_CONTROL},
    {"shift", MOD_SHIFT},
    {"win", MOD_WIN},
    {"meta", MOD_WIN},
    {"cmd", MOD_WIN},
    {"super", MOD_WIN}
};
