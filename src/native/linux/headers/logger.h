#pragma once
#include <iostream>
#include <iomanip>
#include <sstream>
#include <chrono>
#include <ctime>

// ANSI color codes matching cli-color
namespace AnsiColor {
    static constexpr const char* Reset = "\x1b[0m";
    // Exact matches for cli-color xterm codes
    static constexpr const char* Time = "\x1b[38;5;100m";   // timestamp (dark gold)
    static constexpr const char* Label = "\x1b[38;5;2m";    // label
    static constexpr const char* Message = "\x1b[38;5;7m";  // message
}

#define LOG_TIME() do { \
    auto now = std::chrono::system_clock::now(); \
    auto now_time = std::chrono::system_clock::to_time_t(now); \
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count() % 1000; \
    std::tm local_tm; \
    localtime_r(&now_time, &local_tm); \
    std::cout << AnsiColor::Time << "[" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_hour << ":" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_min << ":" \
              << std::setfill('0') << std::setw(2) << local_tm.tm_sec << "." \
              << std::setfill('0') << std::setw(3) << ms << "] " \
              << AnsiColor::Reset; \
} while(0)

// Main-thread/process log (linux)
#define LOG(msg) do { \
    LOG_TIME(); \
    std::cout << AnsiColor::Label << "clnx: " \
              << AnsiColor::Message << msg \
              << AnsiColor::Reset << std::endl; \
} while(0)

