#pragma once
#include <iostream>
#include <iomanip>
#include <sstream>
#include <chrono>
#include <windows.h>

// Enable ANSI escape sequences for Windows console
inline void enableAnsiColors() {
  HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
  DWORD dwMode = 0;
  GetConsoleMode(hOut, &dwMode);
  dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
  SetConsoleMode(hOut, dwMode);
}

// ANSI color codes matching cli-color
namespace AnsiColor {
  const char *const Reset = "\x1b[0m";
  // Exact matches for cli-color xterm codes
  const char *const Time = "\x1b[38;5;100m"; // clc.xterm(100) - timestamp (dark gold)
  const char *const Label = "\x1b[38;5;2m"; // clc.xterm(2) - label
  const char *const Message = "\x1b[38;5;7m"; // clc.xterm(7) - message
}

#define LOG_TIME() do { \
    auto now = std::chrono::system_clock::now(); \
    auto now_time = std::chrono::system_clock::to_time_t(now); \
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count() % 1000; \
    std::tm local_tm; \
    localtime_s(&local_tm, &now_time); \
    std::cout << AnsiColor::Time << "[" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_hour << ":" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_min << ":" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_sec << "." \
              << std::setfill('0') << std::setw(3) << ms << "] " \
              << AnsiColor::Reset; \
} while(0)

#define LOG(fmt, ...) do { \
    LOG_TIME(); \
    char buffer[1024]; \
    snprintf(buffer, sizeof(buffer), "%s[native] %s" fmt "%s\n", \
             AnsiColor::Label, AnsiColor::Message, ##__VA_ARGS__, AnsiColor::Reset); \
    std::cout << buffer; \
} while(0)