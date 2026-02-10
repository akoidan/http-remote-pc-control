#include <napi.h>
#include <windows.h>
#include <vector>

#include "./headers/utils.h"
#include "./headers/monitor.h"

#include <shtypes.h>

#include "headers/validators.h"

static std::vector<int64_t> gMonitors;

static BOOL CALLBACK EnumMonitorsProc(HMONITOR hMonitor, HDC hdcMonitor, LPRECT lprcMonitor, LPARAM dwData) {
  gMonitors.push_back(reinterpret_cast<int64_t>(hMonitor));
  return TRUE;
}

static Napi::Array getMonitors(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  gMonitors.clear();
  if (!EnumDisplayMonitors(NULL, NULL, &EnumMonitorsProc, NULL)) {
    throw Napi::Error::New(env, "Unable to enumarate monitors, winAPI returned error");
  }
  auto arr = Napi::Array::New(env);
  uint32_t i = 0;
  for (auto handle : gMonitors) {
    arr.Set(i++, Napi::Number::New(env, handle));
  }
  return arr;
}

static Napi::Number getMonitorFromWindow(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};
  GET_INT_64(info, 0, handle, HWND);
  HMONITOR mid = MonitorFromWindow(handle, 0);
  return Napi::Number::New(env, reinterpret_cast<int64_t>(mid));
}

using lp_GetScaleFactorForMonitor = int(__stdcall*)(HMONITOR, DEVICE_SCALE_FACTOR*);

static Napi::Object getMonitorInfo(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  GET_INT_64(info, 0, handle, HMONITOR);

  if (handle == nullptr) {
    throw Napi::Error::New(env, "Monitor handle is null or invalid");
  }

  MONITORINFO mInfo;
  mInfo.cbSize = sizeof(MONITORINFO);
  BOOL ok = GetMonitorInfoA(handle, &mInfo);
  if (!ok) {
    throw Napi::Error::New(env, "Monitor not found");
  }

  Napi::Object bounds{Napi::Object::New(env)};
  bounds.Set("x", mInfo.rcMonitor.left);
  bounds.Set("y", mInfo.rcMonitor.top);
  bounds.Set("width", mInfo.rcMonitor.right - mInfo.rcMonitor.left);
  bounds.Set("height", mInfo.rcMonitor.bottom - mInfo.rcMonitor.top);

  Napi::Object workArea{Napi::Object::New(env)};
  workArea.Set("x", mInfo.rcWork.left);
  workArea.Set("y", mInfo.rcWork.top);
  workArea.Set("width", mInfo.rcWork.right - mInfo.rcWork.left);
  workArea.Set("height", mInfo.rcWork.bottom - mInfo.rcWork.top);

  Napi::Object obj{Napi::Object::New(env)};
  obj.Set("bounds", bounds);
  obj.Set("workArea", workArea);
  obj.Set("workArea", workArea);
  obj.Set("isPrimary", (mInfo.dwFlags & MONITORINFOF_PRIMARY) != 0);

  HMODULE hShcore{LoadLibraryA("SHcore.dll")};
  auto f = (lp_GetScaleFactorForMonitor)GetProcAddress(hShcore, "GetScaleFactorForMonitor");

  DEVICE_SCALE_FACTOR sf{};
  f(handle, &sf);

  obj.Set("scale", static_cast<double>(sf) / 100.);

  return obj;
}

Napi::Object monitor_init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "getMonitors"), Napi::Function::New(env, getMonitors));
  exports.Set(Napi::String::New(env, "getMonitorFromWindow"), Napi::Function::New(env, getMonitorFromWindow));
  exports.Set(Napi::String::New(env, "getMonitorInfo"), Napi::Function::New(env, getMonitorInfo));
  return exports;
}