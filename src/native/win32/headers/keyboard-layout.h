#pragma once

#include <napi.h>
#include <windows.h>
#include <vector>

// Get all installed keyboard layouts
std::vector<HKL> getInstalledKeyboardLayouts();

// Check if a keyboard layout is installed
bool isKeyboardLayoutInstalled(HKL layout);

// Get the current keyboard layout (system-wide)
HKL getSystemKeyboardLayout();

// Get the current keyboard layout (thread-specific)
HKL getCurrentKeyboardLayout();

// Get the keyboard layout for a specific language
HKL getKeyboardLayoutForLanguage(const char *languageCode);

// Set the keyboard layout for the current thread and active window
void setThreadKeyboardLayout(HKL layout, Napi::Env env);

// Save current keyboard layout and set a new one
// Returns the previous layout
HKL saveAndSetKeyboardLayout(HKL newLayout, Napi::Env env);

// Restore previously saved keyboard layout
void restoreKeyboardLayout(HKL savedLayout, Napi::Env env);

// Set keyboard layout by layout ID string (e.g., "00000409" for US English)
void setKeyboardLayoutImpl(const char *layoutId, Napi::Env env);

// Detect language from Unicode character
const char *detectLanguageFromChar(wchar_t ch);

// Get virtual key and required modifiers for a Unicode character
void getVirtualKeyForChar(wchar_t ch, HKL layout, UINT *virtualKey, UINT *modifiers, Napi::Env env);

// Check if Caps Lock is enabled
bool isCapsLockEnabled();

// Ensure Caps Lock is disabled by toggling it off if it's on
void ensureCapsLockDisabled();