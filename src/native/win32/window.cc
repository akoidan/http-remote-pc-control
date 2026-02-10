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
#include "./headers/validators.h"

typedef int (__stdcall*lp_GetScaleFactorForMonitor)(HMONITOR, DEVICE_SCALE_FACTOR*);


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


Napi::Number getWindowActiveId(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle = GetForegroundWindow();

  return Napi::Number::New(env, reinterpret_cast<int64_t>(handle));
}


BOOL CALLBACK enumWindowsByProcessIdProc(HWND hwnd, LPARAM lparam) {
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

  GET_UINT_32(info, 0, processId, DWORD);
  EnumWindowsCallbackArgs args{processId, {}};
  
  if (!EnumWindows(enumWindowsByProcessIdProc, reinterpret_cast<LPARAM>(&args))) {
    DWORD err = GetLastError();
    throw Napi::Error::New(env, "EnumWindows failed with error: " + std::to_string(err));
  }

  auto result = Napi::Array::New(env, args.handles.size());
  for (size_t i = 0; i < args.handles.size(); ++i) {
    result.Set(i, Napi::Number::New(env, reinterpret_cast<int64_t>(args.handles[i])));
  }

  return result;
}




// Get the owner of a window
Napi::Number getWindowOwner(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  GET_INT_64(info, 0, handle, HWND);

  return Napi::Number::New(env, GetWindowLongPtrA(handle, GWLP_HWNDPARENT));
}

// Toggle the transparency of a window
void setWindowIsTransparent(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  GET_INT_64(info, 0, handle, HWND);
  GET_BOOL(info, 1, toggle);

  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  LONG_PTR style{GetWindowLongPtrA(handle, GWL_EXSTYLE)};

  if (!SetWindowLongPtrA(handle, GWL_EXSTYLE, ((toggle) ? (style | WS_EX_LAYERED) : (style & (~WS_EX_LAYERED))))) {
    throw Napi::Error::New(env, "Failed to toggle window transparency");
  }
}

// Set the opacity of a window
void setWindowOpacity(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  GET_INT_64(info, 0, handle, HWND);
  GET_DOUBLE(info, 1, opacity);

  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  if (opacity < 0.0 || opacity > 1.0) {
    throw Napi::Error::New(env, "Opacity must be between 0 and 1");
  }

  if (!SetLayeredWindowAttributes(handle, NULL, static_cast<BYTE>(opacity * 255.), LWA_ALPHA)) {
    DWORD err = GetLastError();
    LONG_PTR style   = GetWindowLongPtr(handle, GWL_STYLE);
    LONG_PTR exstyle = GetWindowLongPtr(handle, GWL_EXSTYLE);
    bool canUseOpacity = !(style & WS_CHILD) &&  (exstyle & WS_EX_LAYERED);
    if (!canUseOpacity) {
      throw Napi::Error::New( env, "Window does not support opacity call setWindowIsTransparent first, err=" + std::to_string(err));
    }
    throw Napi::Error::New(env, "SetLayeredWindowAttributes failed err=" + std::to_string(err));
  }
}

// Set the bounds of a window
void setWindowBounds(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  GET_INT_64(info, 0, handle, HWND);
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

  GET_OBJECT(info, 1, bounds);
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


// Show a window
void setWindowState(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  GET_INT_64(info, 0, handle, HWND);
  GET_STRING(info, 1, type);
  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Invalid window handle");
  }

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
Napi::Boolean setWindowActive(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};
  GET_INT_64(info, 0, handle, HWND);
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

Napi::Object getWindowInfo(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  GET_INT_64(info, 0, handle, HWND);

  if (!IsWindow(handle)) {
    throw Napi::Error::New(env, "Window with current id not found");
  }

  int bufsize = GetWindowTextLengthW(handle) + 1;
  LPWSTR t = new WCHAR[bufsize];
  GetWindowTextW(handle, t, bufsize);
  std::wstring ws(t);
  std::string title = toUtf8(ws);

  auto process = getWindowProcess(handle, env);
  BYTE opacity{};
  GetLayeredWindowAttributes(handle, NULL, &opacity, NULL);

  RECT rect{};
  GetWindowRect(handle, &rect);
  Napi::Object bounds{Napi::Object::New(env)};
  bounds.Set("x", rect.left);
  bounds.Set("y", rect.top);
  bounds.Set("width", rect.right - rect.left);
  bounds.Set("height", rect.bottom - rect.top);


  Napi::Object result = Napi::Object::New(env);
  result.Set("wid", Napi::Number::New(env, static_cast<double>(reinterpret_cast<uintptr_t>(handle))));
  result.Set("pid", process.pid);
  result.Set("path", process.path);
  result.Set("bounds", bounds);
  result.Set("title", Napi::String::New(env, title));
  result.Set("opacity", Napi::Number::New(env, static_cast<double>(opacity) / 255.));

  return result;
}


// Initialize the window module
Napi::Object window_init(Napi::Env env, Napi::Object exports) {

  exports.Set(Napi::String::New(env, "setWindowActive"), Napi::Function::New(env, setWindowActive));
  exports.Set(Napi::String::New(env, "getWindowActiveId"), Napi::Function::New(env, getWindowActiveId));
  exports.Set(Napi::String::New(env, "getWindowsByProcessId"), Napi::Function::New(env, getWindowsByProcessId));
  exports.Set(Napi::String::New(env, "setWindowState"), Napi::Function::New(env, setWindowState));
  exports.Set(Napi::String::New(env, "getWindowInfo"), Napi::Function::New(env, getWindowInfo));
  exports.Set(Napi::String::New(env, "setWindowBounds"), Napi::Function::New(env, setWindowBounds));

  // WINDOWS only
  exports.Set(Napi::String::New(env, "setWindowIsTransparent"), Napi::Function::New(env, setWindowIsTransparent));
  exports.Set(Napi::String::New(env, "setWindowOpacity"), Napi::Function::New(env, setWindowOpacity));

  return exports;
}


// std::vector<int64_t> _windows;
// BOOL CALLBACK enumWindowsProc(HWND hwnd, LPARAM lparam) {
//   _windows.push_back(reinterpret_cast<int64_t>(hwnd));
//   return TRUE;
// }
//
// // Get all window handles
// Napi::Array getWindows(const Napi::CallbackInfo& info) {
//   Napi::Env env{info.Env()};
//
//   _windows.clear();
//   EnumWindows(&enumWindowsProc, NULL);
//
//   auto arr = Napi::Array::New(env);
//   auto i = 0;
//   for (auto _win : _windows) {
//     arr.Set(i++, Napi::Number::New(env, _win));
//   }
//
//   return arr;
// }

// Initialize a window object


// Check if a window is visible
// Napi::Boolean isWindowVisible(const Napi::CallbackInfo& info) {
//   Napi::Env env{info.Env()};
//
//   ASSERT_NUMBER(info, 0)
  // HWND handle = reinterpret_cast<HWND>(info[0].As<Napi::Number>().Int64Value());
//
//   return Napi::Boolean::New(env, IsWindowVisible(handle));
// }


// Set the owner of a window
// void setWindowOwner(const Napi::CallbackInfo& info) {
//   Napi::Env env{info.Env()};
//
//   GET_INT_64(info, 0, handle, HWND);
//   if (!IsWindow(handle)) {
//     throw Napi::Error::New(env, "Invalid window handle");
//   }
//
//   auto newOwner{static_cast<LONG_PTR>(info[1].As<Napi::Number>().Int64Value())};
//   if (newOwner != 0 && !IsWindow(reinterpret_cast<HWND>(newOwner))) {
//     throw Napi::Error::New(env, "Invalid owner window handle");
//   }
//
//   if (SetWindowLongPtrA(handle, GWLP_HWNDPARENT, newOwner) == 0 && GetLastError() != 0) {
//     throw Napi::Error::New(env, "Failed to set window owner");
//   }
// }


// Get the opacity of a window
// Napi::Number getWindowOpacity(const Napi::CallbackInfo& info) {
//   Napi::Env env{info.Env()};
//
//   GET_INT_64(info, 0, handle, HWND);
//
//   BYTE opacity{};
//   GetLayeredWindowAttributes(handle, NULL, &opacity, NULL);
//
//   return Napi::Number::New(env, static_cast<double>(opacity) / 255.);
// }