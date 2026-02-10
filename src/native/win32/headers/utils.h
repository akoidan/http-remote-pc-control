#pragma once

#include <napi.h>

// Helper to extract typed values from N-API callback arguments where
// numeric handles are passed from JS and stored as 64-bit numbers.
// Usage: auto handle = getValueFromCallbackData<HWND>(info, 0);


inline std::string toUtf8(const std::wstring &str) {
  std::string ret;
  int len = WideCharToMultiByte(CP_UTF8, 0, str.c_str(), str.length(), NULL, 0, NULL, NULL);
  if (len > 0) {
    ret.resize(len);
    WideCharToMultiByte(CP_UTF8, 0, str.c_str(), str.length(), &ret[0], len, NULL, NULL);
  }
  return ret;
}