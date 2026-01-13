#include <napi.h>
#include <windows.h>
#include <vector>

#include "./headers/utils.h"
#include "./headers/monitor.h"

#include <shtypes.h>

static std::vector<int64_t> g_monitors;

static BOOL CALLBACK EnumMonitorsProc(HMONITOR hMonitor, HDC hdcMonitor, LPRECT lprcMonitor, LPARAM dwData) {
  g_monitors.push_back(reinterpret_cast<int64_t>(hMonitor));
  return TRUE;
}

static Napi::Array getMonitors(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  g_monitors.clear();
  if (EnumDisplayMonitors(NULL, NULL, &EnumMonitorsProc, NULL)) {
    auto arr = Napi::Array::New(env);
    uint32_t i = 0;
    for (auto handle : g_monitors) {
      arr.Set(i++, Napi::Number::New(env, handle));
    }
    return arr;
  }

  return Napi::Array::New(env);
}

static Napi::Number getMonitorFromWindow(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};
  auto handle = getValueFromCallbackData<HWND>(info, 0);
  return Napi::Number::New(env, reinterpret_cast<int64_t>(MonitorFromWindow(handle, 0)));
}

using lp_GetScaleFactorForMonitor = int(__stdcall*)(HMONITOR, DEVICE_SCALE_FACTOR*);

static Napi::Number getMonitorScaleFactor(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  HMODULE hShcore{LoadLibraryA("SHcore.dll")};
  auto f = (lp_GetScaleFactorForMonitor)GetProcAddress(hShcore, "GetScaleFactorForMonitor");

  DEVICE_SCALE_FACTOR sf{};
  f(getValueFromCallbackData<HMONITOR>(info, 0), &sf);

  return Napi::Number::New(env, static_cast<double>(sf) / 100.);
}

static Napi::Object getMonitorInfo(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  auto handle{getValueFromCallbackData<HMONITOR>(info, 0)};

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
  obj.Set("isPrimary", (mInfo.dwFlags & MONITORINFOF_PRIMARY) != 0);

  return obj;
}

Napi::Object monitor_init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "getMonitors"), Napi::Function::New(env, getMonitors));
  exports.Set(Napi::String::New(env, "getMonitorFromWindow"), Napi::Function::New(env, getMonitorFromWindow));
  exports.Set(Napi::String::New(env, "getMonitorInfo"), Napi::Function::New(env, getMonitorInfo));
  exports.Set(Napi::String::New(env, "getMonitorScaleFactor"), Napi::Function::New(env, getMonitorScaleFactor));
  return exports;
}