#pragma once

#include <windows.h>
#include <vector>
#include <string>

// Get all installed keyboard layouts
std::vector<HKL> GetInstalledKeyboardLayouts();

// Check if a keyboard layout is installed
bool IsKeyboardLayoutInstalled(HKL layout);

// Get the current keyboard layout (system-wide)
HKL GetSystemKeyboardLayout();

// Get the current keyboard layout (thread-specific)
HKL GetCurrentKeyboardLayout();

// Get the keyboard layout for a specific language
HKL GetKeyboardLayoutForLanguage(const char* languageCode);

// Set the keyboard layout for the current thread and active window
bool SetThreadKeyboardLayout(HKL layout);

// Save current keyboard layout and set a new one
// Returns the previous layout
HKL SaveAndSetKeyboardLayout(HKL newLayout);

// Restore previously saved keyboard layout
void RestoreKeyboardLayout(HKL savedLayout);

// Detect language from Unicode character
const char* DetectLanguageFromChar(wchar_t ch);

// Get virtual key and required modifiers for a Unicode character
bool GetVirtualKeyForChar(wchar_t ch, HKL layout, UINT* virtualKey, UINT* modifiers);

// Check if Caps Lock is enabled
bool isCapsLockEnabled();

// Ensure Caps Lock is disabled by toggling it off if it's on
void ensureCapsLockDisabled();
