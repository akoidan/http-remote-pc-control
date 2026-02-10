#include <iostream>
#include <napi.h>
#include <shtypes.h>
#include <string>
#include <windows.h>
#include <psapi.h>
#include <tlhelp32.h>
#include "./headers/validators.h"

Napi::Number createProcess(const Napi::CallbackInfo &info) {
  Napi::Env env{info.Env()};

  GET_STRING(info, 0, path);
  GET_STRING_UTF8(info, 1, cmd);

  STARTUPINFOA sInfo = {sizeof (sInfo)};
  PROCESS_INFORMATION processInfo;
  CreateProcessA(path.c_str(), &cmd[0], NULL, NULL, FALSE,
                 CREATE_NEW_PROCESS_GROUP | CREATE_NEW_CONSOLE, NULL, NULL, &sInfo, &processInfo);

  return Napi::Number::New(env, processInfo.dwProcessId);
}


Napi::Object getProcessMemoryInfo(const Napi::Env env, HANDLE pHandle) {
  PROCESS_MEMORY_COUNTERS_EX pmc;
  if (!GetProcessMemoryInfo(pHandle, (PROCESS_MEMORY_COUNTERS *) &pmc, sizeof(pmc))) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "GetProcessMemoryInfo failed err=" + std::to_string(err));
  }
  Napi::Object memory = Napi::Object::New(env);
  memory.Set("workingSetSize", Napi::Number::New(env, (double) pmc.WorkingSetSize));
  memory.Set("peakWorkingSetSize", Napi::Number::New(env, (double) pmc.PeakWorkingSetSize));
  memory.Set("privateUsage", Napi::Number::New(env, (double) pmc.PrivateUsage));
  memory.Set("pageFileUsage", Napi::Number::New(env, (double) pmc.PagefileUsage));
  return memory;
}

Napi::Object getProcesTimes(const Napi::Env env, HANDLE pHandle) {
  FILETIME creationTime, exitTime, kernelTime, userTime;
  if (!GetProcessTimes(pHandle, &creationTime, &exitTime, &kernelTime, &userTime)) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "GetProcessTimes failed err=" + std::to_string(err));
  }
  Napi::Object times = Napi::Object::New(env);
  ULARGE_INTEGER creation, kernel, user;
  creation.LowPart = creationTime.dwLowDateTime;
  creation.HighPart = creationTime.dwHighDateTime;
  kernel.LowPart = kernelTime.dwLowDateTime;
  kernel.HighPart = kernelTime.dwHighDateTime;
  user.LowPart = userTime.dwLowDateTime;
  user.HighPart = userTime.dwHighDateTime;

  times.Set("creationTime", Napi::Number::New(env, (double) creation.QuadPart));
  times.Set("kernelTime", Napi::Number::New(env, (double) kernel.QuadPart));
  times.Set("userTime", Napi::Number::New(env, (double) user.QuadPart));
  return times;
}

Napi::String getProcessPath(const Napi::Env env, HANDLE pHandle) {
  // Get executable path
  WCHAR exePath[MAX_PATH];
  DWORD pathSize = MAX_PATH;
  if (!QueryFullProcessImageNameW(pHandle, 0, exePath, &pathSize)) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "QueryFullProcessImageNameW failed err=" + std::to_string(err));
  }

  // Convert wide string to UTF-8
  int utf8Size = WideCharToMultiByte(CP_UTF8, 0, exePath, pathSize, nullptr, 0, nullptr, nullptr);
  if (utf8Size <= 0) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "WideCharToMultiByte (size calculation) failed err=" + std::to_string(err));
  }

  std::string utf8Path(utf8Size, 0);
  int convertedSize = WideCharToMultiByte(CP_UTF8, 0, exePath, pathSize, &utf8Path[0], utf8Size, nullptr, nullptr);
  if (convertedSize <= 0) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "WideCharToMultiByte (conversion) failed err=" + std::to_string(err));
  }

  return Napi::String::New(env, utf8Path);
}


std::tuple<double, double> getProcessThreads(const Napi::Env env, HANDLE pHandle, DWORD pid) {
  HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
  if (snapshot == INVALID_HANDLE_VALUE) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "CreateToolhelp32Snapshot failed err=" + std::to_string(err));
  }

  PROCESSENTRY32W pe32;
  pe32.dwSize = sizeof(pe32);
  if (!Process32FirstW(snapshot, &pe32)) {
    DWORD err = GetLastError();
    CloseHandle(snapshot);
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "Process32FirstW failed err=" + std::to_string(err));
  }

  std::tuple<double, double> result;
  bool found = false;
  do {
    if (pe32.th32ProcessID == pid) {
      result = std::make_tuple(pe32.th32ParentProcessID, pe32.cntThreads);
      found = true;
      break;
    }
  } while (Process32NextW(snapshot, &pe32));
  CloseHandle(snapshot);

  if (!found) {
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "Process not found in snapshot");
  }
  return result;
}


BOOL isProcessElevatedImp(const Napi::Env env, HANDLE pHandle) {
  HANDLE hToken = nullptr;
  if (!OpenProcessToken(pHandle, TOKEN_QUERY, &hToken)) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "OpenProcessToken failed err=" + std::to_string(err));
  }

  TOKEN_ELEVATION elevation;
  DWORD retLen = 0;
  if (!GetTokenInformation(hToken, TokenElevation, &elevation, sizeof(elevation), &retLen)) {
    DWORD err = GetLastError();
    CloseHandle(hToken);
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "GetTokenInformation failed err=" + std::to_string(err));
  }
  CloseHandle(hToken);
  return elevation.TokenIsElevated != 0;
}


Napi::Boolean isProcessElevated(const Napi::CallbackInfo &info) {
  Napi::Env env{info.Env()};
  HANDLE hToken = nullptr;
  if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &hToken)) {
    return Napi::Boolean::New(env, false);
  }
  BOOL isElavated = isProcessElevatedImp(env, GetCurrentProcess());
  CloseHandle(hToken);
  return Napi::Boolean::New(env, isElavated);
}


Napi::Object getProcessInfo(const Napi::CallbackInfo &info) {
  Napi::Env env{info.Env()};

  GET_UINT_32(info, 0, pid, DWORD);

  // Open process with query rights
  HANDLE pHandle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
  if (!pHandle) {
    DWORD err = GetLastError();
    throw Napi::Error::New(env, "OpenProcess failed err=" + std::to_string(err));
  }

  Napi::Object result = Napi::Object::New(env);

  Napi::String path = getProcessPath(env, pHandle);
  result.Set("path", path);

  Napi::Object memory = getProcessMemoryInfo(env, pHandle);

  result.Set("memory", memory);
  // Get memory usage

  Napi::Object times = getProcesTimes(env, pHandle);
  result.Set("times", times);

  // Get process ID and parent ID
  result.Set("pid", Napi::Number::New(env, pid));

  std::tuple<double, double> threads = getProcessThreads(env, pHandle, pid);
  result.Set("parentPid", Napi::Number::New(env, std::get<0>(threads)));
  result.Set("threadCount", Napi::Number::New(env, std::get<1>(threads)));

  // Check if process is elevated
  HANDLE hToken = nullptr;
  if (!OpenProcessToken(pHandle, TOKEN_QUERY, &hToken)) {
    DWORD err = GetLastError();
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "OpenProcessToken failed err=" + std::to_string(err));
  }

  TOKEN_ELEVATION elevation;
  DWORD retLen = 0;
  if (!GetTokenInformation(hToken, TokenElevation, &elevation, sizeof(elevation), &retLen)) {
    DWORD err = GetLastError();
    CloseHandle(hToken);
    CloseHandle(pHandle);
    throw Napi::Error::New(env, "GetTokenInformation failed err=" + std::to_string(err));
  }
  
  result.Set("isElevated", Napi::Boolean::New(env, elevation.TokenIsElevated != 0));
  CloseHandle(hToken);

  CloseHandle(pHandle);
  return result;
}

Napi::Object processInit(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "createProcess"), Napi::Function::New(env, createProcess));
  exports.Set(Napi::String::New(env, "isProcessElevated"), Napi::Function::New(env, isProcessElevated));
  exports.Set(Napi::String::New(env, "getProcessInfo"), Napi::Function::New(env, getProcessInfo));
  return exports;
}
