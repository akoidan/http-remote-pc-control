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

typedef int (__stdcall*lp_GetScaleFactorForMonitor)(HMONITOR, DEVICE_SCALE_FACTOR*);


std::wstring get_wstring(const std::string str) {
  return std::wstring(str.begin(), str.end());
}

std::string toUtf8(const std::wstring& str) {
  std::string ret;
  int len = WideCharToMultiByte(CP_UTF8, 0, str.c_str(), str.length(), NULL, 0, NULL, NULL);
  if (len > 0) {
    ret.resize(len);
    WideCharToMultiByte(CP_UTF8, 0, str.c_str(), str.length(), &ret[0], len, NULL, NULL);
  }
  return ret;
}

Process getWindowProcess(HWND handle, Napi::Env env) {
  DWORD pid{0};
  DWORD tid = GetWindowThreadProcessId(handle, &pid);
  if (tid == 0) {
    throw Napi::Error::New(env, "Windows API failed to get window for current process id");
  }

  HANDLE pHandle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
  if (!pHandle) {
    DWORD err = GetLastError();
    throw Napi::Error::New(env, "OpenProcess failed err=" + std::to_string(err));
  }

  DWORD dwSize{MAX_PATH};
  wchar_t exeName[MAX_PATH]{};

  if (!QueryFullProcessImageNameW(pHandle, 0, exeName, &dwSize)) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "QueryFullProcessImageNameW failed err=" + std::to_string(err));
  }

  CloseHandle(pHandle);

  auto wspath(exeName);
  auto path = toUtf8(wspath);

  return {static_cast<int>(pid), path};
}


Napi::Number getProcessMainWindow(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  unsigned long process_id = info[0].ToNumber().Uint32Value();

  auto handle = find_top_window(process_id, env);

  return Napi::Number::New(env, reinterpret_cast<int64_t>(handle));
}

Napi::Number getActiveWindowId(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle = GetForegroundWindow();

  return Napi::Number::New(env, reinterpret_cast<int64_t>(handle));
}

std::vector<int64_t> _windows;

BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lparam) {
  _windows.push_back(reinterpret_cast<int64_t>(hwnd));
  return TRUE;
}

// Get all window handles
Napi::Array getWindows(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  _windows.clear();
  EnumWindows(&EnumWindowsProc, NULL);

  auto arr = Napi::Array::New(env);
  auto i = 0;
  for (auto _win : _windows) {
    arr.Set(i++, Napi::Number::New(env, _win));
  }

  return arr;
}

// Enumerate windows by process ID
struct EnumWindowsCallbackArgs {
  DWORD processId;
  std::vector<HWND> handles;
};

BOOL CALLBACK EnumWindowsByProcessIdProc(HWND hwnd, LPARAM lparam) {
  auto& args = *reinterpret_cast<EnumWindowsCallbackArgs*>(lparam);
  DWORD processId = 0;
  GetWindowThreadProcessId(hwnd, &processId);
  
  if (processId == args.processId) {
    args.handles.push_back(hwnd);
  }
  
  return TRUE; // Continue enumeration
}

// Get all window handles for a specified process ID
Napi::Array getWindowsByProcessId(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  if (info.Length() < 1 || !info[0].IsNumber()) {
    throw Napi::TypeError::New(env, "Process ID must be a number");
  }

  DWORD processId = info[0].As<Napi::Number>().Uint32Value();
  EnumWindowsCallbackArgs args{processId, {}};
  
  if (!EnumWindows(EnumWindowsByProcessIdProc, reinterpret_cast<LPARAM>(&args))) {
    DWORD err = GetLastError();
    throw Napi::Error::New(env, "EnumWindows failed with error: " + std::to_string(err));
  }

  auto result = Napi::Array::New(env, args.handles.size());
  for (size_t i = 0; i < args.handles.size(); ++i) {
    result.Set(i, Napi::Number::New(env, reinterpret_cast<int64_t>(args.handles[i])));
  }

  return result;
}

// Initialize a window object
Napi::Object initWindow(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};

  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Window with current id not found");
  }

  auto process = getWindowProcess(handle, env);

  Napi::Object obj{Napi::Object::New(env)};

  obj.Set("processId", process.pid);
  obj.Set("path", process.path);

  return obj;
}

// Get the bounds of a window
Napi::Object getWindowBounds(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};

  RECT rect{};
  GetWindowRect(handle, &rect);

  Napi::Object bounds{Napi::Object::New(env)};

  bounds.Set("x", rect.left);
  bounds.Set("y", rect.top);
  bounds.Set("width", rect.right - rect.left);
  bounds.Set("height", rect.bottom - rect.top);

  return bounds;
}

// Get the title of a window
Napi::String getWindowTitle(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};

  int bufsize = GetWindowTextLengthW(handle) + 1;
  LPWSTR t = new WCHAR[bufsize];
  GetWindowTextW(handle, t, bufsize);

  std::wstring ws(t);
  std::string title = toUtf8(ws);

  return Napi::String::New(env, title);
}

// Get the opacity of a window
Napi::Number getWindowOpacity(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};

  BYTE opacity{};
  GetLayeredWindowAttributes(handle, NULL, &opacity, NULL);

  return Napi::Number::New(env, static_cast<double>(opacity) / 255.);
}

// Get the owner of a window
Napi::Number getWindowOwner(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};

  return Napi::Number::New(env, GetWindowLongPtrA(handle, GWLP_HWNDPARENT));
}

// Toggle the transparency of a window
void toggleWindowTransparency(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  bool toggle{info[1].As<Napi::Boolean>()};
  LONG_PTR style{GetWindowLongPtrA(handle, GWL_EXSTYLE)};

  if (!SetWindowLongPtrA(handle, GWL_EXSTYLE, ((toggle) ? (style | WS_EX_LAYERED) : (style & (~WS_EX_LAYERED))))) {
    throw Napi::Error::New(env, "Failed to toggle window transparency");
  }
}

// Set the opacity of a window
void setWindowOpacity(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  double opacity{info[1].As<Napi::Number>().DoubleValue()};
  if (opacity < 0.0 || opacity > 1.0) {
    throw Napi::Error::New(env, "Opacity must be between 0 and 1");
  }

  if (!SetLayeredWindowAttributes(handle, NULL, static_cast<BYTE>(opacity * 255.), LWA_ALPHA)) {
    throw Napi::Error::New(env, "Failed to set window opacity");
  }
}

// Set the bounds of a window
void setWindowBounds(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  Napi::Object bounds{info[1].As<Napi::Object>()};
  int x = bounds.Get("x").ToNumber().Int32Value();
  int y = bounds.Get("y").ToNumber().Int32Value();
  int width = bounds.Get("width").ToNumber().Int32Value();
  int height = bounds.Get("height").ToNumber().Int32Value();

  if (width <= 0 || height <= 0) {
    throw Napi::Error::New(env, "Invalid window dimensions");
  }

  if (!MoveWindow(handle, x, y, width, height, TRUE)) {
    throw Napi::Error::New(env, "Failed to set window bounds");
  }
}

// Set the owner of a window
void setWindowOwner(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  auto newOwner{static_cast<LONG_PTR>(info[1].As<Napi::Number>().Int64Value())};
  if (newOwner != 0 && !IsWindow(reinterpret_cast<HWND>(newOwner))) {
    throw Napi::Error::New(env, "Invalid owner window handle");
  }

  if (SetWindowLongPtrA(handle, GWLP_HWNDPARENT, newOwner) == 0 && GetLastError() != 0) {
    throw Napi::Error::New(env, "Failed to set window owner");
  }
}

// Show a window
void showWindow(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  std::string type{info[1].As<Napi::String>()};

  int flag = SW_SHOW;

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
  else {
    throw Napi::Error::New(env, "Invalid window show type");
  }

  if (!ShowWindow(handle, flag)) {
    throw Napi::Error::New(env, "Failed to change window state");
  }
}

// Bring a window to the top
Napi::Boolean bringWindowToTop(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};
  auto handle{getValueFromCallbackData<HWND>(info, 0)};
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Window with current id not found");
  }
  BOOL b{SetForegroundWindow(handle)};

  HWND hCurWnd = ::GetForegroundWindow();
  DWORD dwMyID = ::GetCurrentThreadId();
  DWORD dwCurID = ::GetWindowThreadProcessId(hCurWnd, NULL);
  ::AttachThreadInput(dwCurID, dwMyID, TRUE);
  ::SetWindowPos(handle, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
  ::SetWindowPos(handle, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE);
  ::SetForegroundWindow(handle);
  ::AttachThreadInput(dwCurID, dwMyID, FALSE);
  ::SetFocus(handle);
  ::SetActiveWindow(handle);

  return Napi::Boolean::New(env, b);
}

// Redraw a window
void redrawWindow(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  if (!SetWindowPos(handle, 0, 0, 0, 0, 0,
                    SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER |
                    SWP_NOOWNERZORDER | SWP_NOACTIVATE | SWP_DRAWFRAME | SWP_NOCOPYBITS)) {
    throw Napi::Error::New(env, "Failed to redraw window");
  }
}

// Check if a window is valid
Napi::Boolean isWindow(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};

  return Napi::Boolean::New(env, IsWindow(handle));
}

// Check if a window is visible
Napi::Boolean isWindowVisible(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HWND>(info, 0)};

  return Napi::Boolean::New(env, IsWindowVisible(handle));
}


// Initialize the window module
Napi::Object window_init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "bringWindowToTop"), Napi::Function::New(env, bringWindowToTop));
  exports.Set(Napi::String::New(env, "getActiveWindowId"), Napi::Function::New(env, getActiveWindowId));
  exports.Set(Napi::String::New(env, "getWindowsByProcessId"), Napi::Function::New(env, getWindowsByProcessId));


  exports.Set(Napi::String::New(env, "setWindowBounds"), Napi::Function::New(env, setWindowBounds));


  exports.Set(Napi::String::New(env, "setVisibility"), Napi::Function::New(env, showWindow));
  exports.Set(Napi::String::New(env, "redrawWindow"), Napi::Function::New(env, redrawWindow));
  exports.Set(Napi::String::New(env, "isWindow"), Napi::Function::New(env, isWindow));
  exports.Set(Napi::String::New(env, "isWindowVisible"), Napi::Function::New(env, isWindowVisible));
  exports.Set(Napi::String::New(env, "setWindowOpacity"), Napi::Function::New(env, setWindowOpacity));
  exports.Set(Napi::String::New(env, "toggleWindowTransparency"),
              Napi::Function::New(env, toggleWindowTransparency));
  exports.Set(Napi::String::New(env, "setWindowOwner"), Napi::Function::New(env, setWindowOwner));
  exports.Set(Napi::String::New(env, "initWindow"), Napi::Function::New(env, initWindow));
  exports.Set(Napi::String::New(env, "getWindowBounds"), Napi::Function::New(env, getWindowBounds));
  exports.Set(Napi::String::New(env, "getWindowTitle"), Napi::Function::New(env, getWindowTitle));
  exports.Set(Napi::String::New(env, "getWindowOwner"), Napi::Function::New(env, getWindowOwner));
  exports.Set(Napi::String::New(env, "getWindowOpacity"), Napi::Function::New(env, getWindowOpacity));
  exports.Set(Napi::String::New(env, "getWindows"), Napi::Function::New(env, getWindows));
  exports.Set(Napi::String::New(env, "getProcessMainWindow"), Napi::Function::New(env, getProcessMainWindow));
  exports.Set(Napi::String::New(env, "getActiveWindowInfo"), Napi::Function::New(env, getActiveWindowInfo));

  return exports;
}