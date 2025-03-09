#include "./headers/mouse.h"
#include <napi.h>
#include <windows.h>

#define ABSOLUTE_COORD_CONST 65536

MMPoint CalculateAbsoluteCoordinates(MMPoint point) {
    RECT screen;
    GetClientRect(GetDesktopWindow(), &screen);
    int width = screen.right - screen.left;
    int height = screen.bottom - screen.top;
    
    MMPoint absolute;
    absolute.x = (point.x * ABSOLUTE_COORD_CONST) / width;
    absolute.y = (point.y * ABSOLUTE_COORD_CONST) / height;
    return absolute;
}

void moveMouse(MMPoint point) {
    INPUT input = {0};
    MMPoint absolute = CalculateAbsoluteCoordinates(point);
    
    input.type = INPUT_MOUSE;
    input.mi.dx = absolute.x;
    input.mi.dy = absolute.y;
    input.mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE;
    
    SendInput(1, &input, sizeof(INPUT));
}

MMPoint getMousePos() {
    POINT point;
    GetCursorPos(&point);
    
    MMPoint pos;
    pos.x = point.x;
    pos.y = point.y;
    return pos;
}

void toggleMouse(bool down, unsigned int button) {
    INPUT input = {0};
    input.type = INPUT_MOUSE;
    
    switch(button) {
        case LEFT_BUTTON:
            input.mi.dwFlags = down ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP;
            break;
        case RIGHT_BUTTON:
            input.mi.dwFlags = down ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP;
            break;
        case MIDDLE_BUTTON:
            input.mi.dwFlags = down ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_MIDDLEUP;
            break;
    }
    
    SendInput(1, &input, sizeof(INPUT));
}

void clickMouse(unsigned int button) {
    toggleMouse(true, button);
    toggleMouse(false, button);
}

Napi::Value _mouseClick(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    clickMouse(LEFT_BUTTON);
    return env.Undefined();
}

Napi::Number _moveMouse(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    if (info.Length() != 2) {
        throw Napi::Error::New(env, "Invalid number of arguments.");
    }

    size_t x = info[0].As<Napi::Number>().Int32Value();
    size_t y = info[1].As<Napi::Number>().Int32Value();

    MMPoint point;
    point.x = x;
    point.y = y;
    moveMouse(point);
    return Napi::Number::New(env, LEFT_BUTTON);
}

Napi::Object init_mouse(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "mouseMove"), Napi::Function::New(env, _moveMouse));
    exports.Set(Napi::String::New(env, "mouseClick"), Napi::Function::New(env, _mouseClick));
    return exports;
}
