//
// Created by andrew on 2/2/25.
//

#ifndef NATIVE_MOUSE_H
#define NATIVE_MOUSE_H

struct MMPoint {
    int64_t x;
    int64_t y;
};

enum MMMouseButton {
    LEFT_BUTTON = 1,
    CENTER_BUTTON = 2,
    RIGHT_BUTTON = 3
};

#endif //NATIVE_MOUSE_Hdd
