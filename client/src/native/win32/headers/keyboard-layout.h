#ifndef KEYBOARD_LAYOUT_H
#define KEYBOARD_LAYOUT_H

#include <windows.h>
#include <vector>
#include <string>

// Get all installed keyboard layouts
std::vector<HKL> GetInstalledKeyboardLayouts();

// Check if a keyboard layout is installed
bool IsKeyboardLayoutInstalled(HKL layout);

// Get the current keyboard layout
HKL GetCurrentKeyboardLayout();

// Get the keyboard layout for a specific language
HKL GetKeyboardLayoutForLanguage(const char* languageCode);

// Set the keyboard layout for the current thread
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

#endif // KEYBOARD_LAYOUT_H
