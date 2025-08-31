/*
 * This file was originally sourced from the node-window-manager library
 * (https://github.com/sentialx/node-window-manager).
 *
 * Licensed under the MIT License. See LICENSE file in the root of this repository
 * or https://github.com/sentialx/node-window-manager?tab=MIT-1-ov-file#readme for details.
 */

#include <cmath>
#include <cstdint>
#include <iostream>
#include <napi.h>
#include <shtypes.h>
#include <string>
#include <windows.h>
#include "./headers/window.h"
#include "./headers/logger.h"
#include "./headers/utils.h"

typedef int (__stdcall* lp_GetScaleFactorForMonitor) (HMONITOR, DEVICE_SCALE_FACTOR*);

struct Process {
    int pid;
    std::string path;
};


std::wstring get_wstring (const std::string str) {
    return std::wstring (str.begin (), str.end ());
}

std::string toUtf8 (const std::wstring& str) {
    std::string ret;
    int len = WideCharToMultiByte (CP_UTF8, 0, str.c_str (), str.length (), NULL, 0, NULL, NULL);
    if (len > 0) {
        ret.resize (len);
        WideCharToMultiByte (CP_UTF8, 0, str.c_str (), str.length (), &ret[0], len, NULL, NULL);
    }
    return ret;
}

Process getWindowProcess (HWND handle) {
    DWORD pid{ 0 };
    GetWindowThreadProcessId (handle, &pid);

    HANDLE pHandle{ OpenProcess (PROCESS_QUERY_LIMITED_INFORMATION, false, pid) };

    DWORD dwSize{ MAX_PATH };
    wchar_t exeName[MAX_PATH]{};

    QueryFullProcessImageNameW (pHandle, 0, exeName, &dwSize);

    CloseHandle(pHandle);

    auto wspath (exeName);
    auto path = toUtf8 (wspath);

    return { static_cast<int> (pid), path };
}

HWND find_top_window (DWORD pid) {
    std::pair<HWND, DWORD> params = { 0, pid };

    BOOL bResult = EnumWindows (
    [] (HWND hwnd, LPARAM lParam) -> BOOL {
        auto pParams = (std::pair<HWND, DWORD>*)(lParam);

        DWORD processId;
        if (GetWindowThreadProcessId (hwnd, &processId) && processId == pParams->second) {
            SetLastError (-1);
            pParams->first = hwnd;
            return FALSE;
        }

        return TRUE;
    },
    (LPARAM)&params);

    if (!bResult && GetLastError () == -1 && params.first) {
        return params.first;
    }

    return 0;
}

Napi::Number getProcessMainWindow (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    unsigned long process_id = info[0].ToNumber ().Uint32Value ();

    auto handle = find_top_window (process_id);

    return Napi::Number::New (env, reinterpret_cast<int64_t> (handle));
}



Napi::Number getActiveWindow (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle = GetForegroundWindow ();

    return Napi::Number::New (env, reinterpret_cast<int64_t> (handle));
}

std::vector<int64_t> _windows;

BOOL CALLBACK EnumWindowsProc (HWND hwnd, LPARAM lparam) {
    _windows.push_back (reinterpret_cast<int64_t> (hwnd));
    return TRUE;
}

Napi::Array getWindows (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    _windows.clear ();
    EnumWindows (&EnumWindowsProc, NULL);

    auto arr = Napi::Array::New (env);
    auto i = 0;
    for (auto _win : _windows) {
        arr.Set (i++, Napi::Number::New (env, _win));
    }

    return arr;
}

Napi::Object initWindow (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };

    if (!IsWindow(handle)) {
        throw Napi::Error::New(env, "Window with current id not found");
    }

    auto process = getWindowProcess (handle);

    Napi::Object obj{ Napi::Object::New (env) };

    obj.Set ("processId", process.pid);
    obj.Set ("path", process.path);

    return obj;
}

Napi::Object getWindowBounds (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };

    RECT rect{};
    if (!GetWindowRect (handle, &rect)) {
        throw Napi::Error::New(env, "GetWindowRect failed");
    }

    Napi::Object bounds{ Napi::Object::New (env) };

    bounds.Set ("x", rect.left);
    bounds.Set ("y", rect.top);
    bounds.Set ("width", rect.right - rect.left);
    bounds.Set ("height", rect.bottom - rect.top);

    return bounds;
}

Napi::String getWindowTitle (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };

    int bufsize = GetWindowTextLengthW (handle) + 1;
    LPWSTR t = new WCHAR[bufsize];
    GetWindowTextW (handle, t, bufsize);

    std::wstring ws (t);
    std::string title = toUtf8 (ws);

    return Napi::String::New (env, title);
}

Napi::Number getWindowOpacity (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };

    BYTE opacity{};
    GetLayeredWindowAttributes (handle, NULL, &opacity, NULL);

    return Napi::Number::New (env, static_cast<double> (opacity) / 255.);
}

Napi::Number getWindowOwner (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };

    return Napi::Number::New (env, GetWindowLongPtrA (handle, GWLP_HWNDPARENT));
}

Napi::Boolean toggleWindowTransparency (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };
    bool toggle{ info[1].As<Napi::Boolean> () };
    LONG_PTR style{ GetWindowLongPtrA (handle, GWL_EXSTYLE) };

    SetLastError(0);
    LONG_PTR prev = SetWindowLongPtrA (handle, GWL_EXSTYLE, ((toggle) ? (style | WS_EX_LAYERED) : (style & (~WS_EX_LAYERED))));
    if (prev == 0 && GetLastError() != 0) {
        throw Napi::Error::New(env, "Failed to toggle WS_EX_LAYERED flag");
    }

    return Napi::Boolean::New (env, true);
}

Napi::Boolean setWindowOpacity (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };
    double opacity{ info[1].As<Napi::Number> ().DoubleValue () };

    BOOL ok = SetLayeredWindowAttributes (handle, NULL, opacity * 255., LWA_ALPHA);
    if (!ok) {
        throw Napi::Error::New(env, "SetLayeredWindowAttributes failed");
    }

    return Napi::Boolean::New (env, true);
}

Napi::Boolean setWindowBounds (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    Napi::Object bounds{ info[1].As<Napi::Object> () };
    auto handle{ getValueFromCallbackData<HWND> (info, 0) };

    BOOL b{ MoveWindow (handle, bounds.Get ("x").ToNumber (), bounds.Get ("y").ToNumber (),
                        bounds.Get ("width").ToNumber (), bounds.Get ("height").ToNumber (), true) };

    if (!b) {
        throw Napi::Error::New(env, "MoveWindow failed");
    }
    return Napi::Boolean::New (env, true);
}

Napi::Boolean setWindowOwner (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };
    auto newOwner{ static_cast<LONG_PTR> (info[1].As<Napi::Number> ().Int64Value ()) };

    SetLastError(0);
    LONG_PTR prev = SetWindowLongPtrA (handle, GWLP_HWNDPARENT, newOwner);
    if (prev == 0 && GetLastError() != 0) {
        throw Napi::Error::New(env, "Failed to set window owner (GWLP_HWNDPARENT)");
    }

    return Napi::Boolean::New (env, true);
}

Napi::Boolean showWindow (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };
    std::string type{ info[1].As<Napi::String> () };

    DWORD flag{ 0 };

    if (type == "show")
        flag = SW_SHOW;
    else if (type == "hide")
        flag = SW_HIDE;
    else if (type == "minimize")
        flag = SW_MINIMIZE;
    else if (type == "restore")
        flag = SW_RESTORE;
    else if (type == "maximize")
        flag = SW_MAXIMIZE;

    BOOL ok = ShowWindow (handle, flag);
        if (!ok) {
            throw Napi::Error::New(env, "ShowWindow failed");
        }
        return Napi::Boolean::New (env, true);
}

Napi::Boolean bringWindowToTop (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };
    auto handle{ getValueFromCallbackData<HWND> (info, 0) };
    if (!IsWindow(handle)) {
        throw Napi::Error::New(env, "Window with current id not found");
    }
    BOOL b{ SetForegroundWindow (handle) };
    if (!b) {
        throw Napi::Error::New(env, "SetForegroundWindow failed");
    }

    HWND hCurWnd = ::GetForegroundWindow ();
    DWORD dwMyID = ::GetCurrentThreadId ();
    DWORD dwCurID = ::GetWindowThreadProcessId (hCurWnd, NULL);
    ::AttachThreadInput (dwCurID, dwMyID, TRUE);
    ::SetWindowPos (handle, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
    ::SetWindowPos (handle, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
    ::SetForegroundWindow (handle);
    ::AttachThreadInput (dwCurID, dwMyID, FALSE);
    ::SetFocus (handle);
    ::SetActiveWindow (handle);

    return Napi::Boolean::New (env, true);
}

Napi::Boolean redrawWindow (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };
    BOOL b{ SetWindowPos (handle, 0, 0, 0, 0, 0,
                          SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER |
                          SWP_NOOWNERZORDER | SWP_NOACTIVATE | SWP_DRAWFRAME | SWP_NOCOPYBITS) };

    if (!b) {
        throw Napi::Error::New(env, "SetWindowPos failed to redraw window");
    }
    return Napi::Boolean::New (env, true);
}

Napi::Boolean isWindow (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };

    return Napi::Boolean::New (env, IsWindow (handle));
}

Napi::Boolean isWindowVisible (const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env () };

    auto handle{ getValueFromCallbackData<HWND> (info, 0) };

    return Napi::Boolean::New (env, IsWindowVisible (handle));
}

Napi::Object getActiveWindowInfo(const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env() };

    auto handle = GetForegroundWindow();
    Process process{0, std::string()};
    if (!handle) {
        LOG("Active window handle is null");
    } else {
        process = getWindowProcess(handle);
    }

    Napi::Object result = Napi::Object::New(env);
    result.Set("wid", Napi::Number::New(env, reinterpret_cast<int64_t>(handle)));
    result.Set("pid", Napi::Number::New(env, process.pid));
    result.Set("path", Napi::String::New(env, process.path));

    return result;
}

Napi::Object window_init (Napi::Env env, Napi::Object exports) {
    exports.Set (Napi::String::New (env, "getActiveWindow"), Napi::Function::New (env, getActiveWindow));
    exports.Set (Napi::String::New (env, "setWindowBounds"), Napi::Function::New (env, setWindowBounds));
    exports.Set (Napi::String::New (env, "showWindow"), Napi::Function::New (env, showWindow));
    exports.Set (Napi::String::New (env, "bringWindowToTop"), Napi::Function::New (env, bringWindowToTop));
    exports.Set (Napi::String::New (env, "redrawWindow"), Napi::Function::New (env, redrawWindow));
    exports.Set (Napi::String::New (env, "isWindow"), Napi::Function::New (env, isWindow));
    exports.Set (Napi::String::New (env, "isWindowVisible"), Napi::Function::New (env, isWindowVisible));
    exports.Set (Napi::String::New (env, "setWindowOpacity"), Napi::Function::New (env, setWindowOpacity));
    exports.Set (Napi::String::New (env, "toggleWindowTransparency"),
                 Napi::Function::New (env, toggleWindowTransparency));
    exports.Set (Napi::String::New (env, "setWindowOwner"), Napi::Function::New (env, setWindowOwner));
    exports.Set (Napi::String::New (env, "initWindow"), Napi::Function::New (env, initWindow));
    exports.Set (Napi::String::New (env, "getWindowBounds"), Napi::Function::New (env, getWindowBounds));
    exports.Set (Napi::String::New (env, "getWindowTitle"), Napi::Function::New (env, getWindowTitle));
    exports.Set (Napi::String::New (env, "getWindowOwner"), Napi::Function::New (env, getWindowOwner));
    exports.Set (Napi::String::New (env, "getWindowOpacity"), Napi::Function::New (env, getWindowOpacity));
    exports.Set (Napi::String::New (env, "getWindows"), Napi::Function::New (env, getWindows));
    exports.Set (Napi::String::New (env, "getProcessMainWindow"), Napi::Function::New (env, getProcessMainWindow));
    exports.Set (Napi::String::New (env, "getActiveWindowInfo"), Napi::Function::New (env, getActiveWindowInfo));

    return exports;
}
