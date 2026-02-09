#pragma once

#include <napi.h>
#include <vector>
#include <string>
#include <cstdint>

// Structure to hold KDE layout information
struct KdeLayout {
  std::string code;
  std::string variant;
  std::string displayName;
};

// Get available keyboard layouts from KDE via DBus
std::vector<KdeLayout> getKdeAvailableLayouts();

// Switch to a specific KDE layout by index
bool switchToKdeLayout(uint32_t layoutIndex);

// Fallback method using XKB group switching for non-KDE systems
bool fallbackLayoutSwitch();

// Main keyboard layout switching function (Napi wrapper)