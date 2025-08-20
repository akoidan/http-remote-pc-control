#include "./headers/keyboard-layout.h"
#include <unordered_map>
#include <string>
#include <vector>
#include <winnls.h>


#define DEBUG_LOG(fmt, ...) fprintf(stdout, "[window-linux] " fmt "\n", ##__VA_ARGS__)

// Helper function to create keyboard layout string from LANGID
std::string MakeKLID(LANGID langId) {
    char klid[KL_NAMELENGTH];
    sprintf_s(klid, KL_NAMELENGTH, "%08x", MAKELCID(langId, SORT_DEFAULT));
    return std::string(klid);
}

// Helper function to get foreground window's layout
HKL GetSystemKeyboardLayout() {
    // Get the foreground window which represents active application
    HWND foreground = GetForegroundWindow();
    if (!foreground) {
        return GetKeyboardLayout(0);
    }
    
    // Get the thread of the foreground window
    DWORD threadId = GetWindowThreadProcessId(foreground, NULL);
    return GetKeyboardLayout(threadId);
}

// Map of common language codes to their keyboard layout IDs
static const std::unordered_map<std::string, std::string> LAYOUT_MAP = {
    {"en", MakeKLID(MAKELANGID(LANG_ENGLISH, SUBLANG_ENGLISH_US))},      // US English
    {"ru", MakeKLID(MAKELANGID(LANG_RUSSIAN, SUBLANG_RUSSIAN_RUSSIA))},  // Russian
    {"uk", MakeKLID(MAKELANGID(LANG_UKRAINIAN, SUBLANG_DEFAULT))},       // Ukrainian
    {"de", MakeKLID(MAKELANGID(LANG_GERMAN, SUBLANG_GERMAN))},          // German
    {"fr", MakeKLID(MAKELANGID(LANG_FRENCH, SUBLANG_FRENCH))},          // French
    {"es", MakeKLID(MAKELANGID(LANG_SPANISH, SUBLANG_SPANISH))},        // Spanish
    {"it", MakeKLID(MAKELANGID(LANG_ITALIAN, SUBLANG_ITALIAN))},        // Italian
    {"pt", MakeKLID(MAKELANGID(LANG_PORTUGUESE, SUBLANG_PORTUGUESE))},   // Portuguese
    {"pl", MakeKLID(MAKELANGID(LANG_POLISH, SUBLANG_DEFAULT))},         // Polish
    {"cs", MakeKLID(MAKELANGID(LANG_CZECH, SUBLANG_DEFAULT))},          // Czech
    {"ja", MakeKLID(MAKELANGID(LANG_JAPANESE, SUBLANG_DEFAULT))},       // Japanese
    {"ko", MakeKLID(MAKELANGID(LANG_KOREAN, SUBLANG_KOREAN))},          // Korean
    {"zh", MakeKLID(MAKELANGID(LANG_CHINESE_SIMPLIFIED, SUBLANG_CHINESE_SIMPLIFIED))} // Chinese (Simplified)
};

std::vector<HKL> GetInstalledKeyboardLayouts() {
    std::vector<HKL> layouts;
    HKL hklArray[256];
    UINT count = GetKeyboardLayoutList(256, hklArray);
    for (UINT i = 0; i < count; i++) {
        layouts.push_back(hklArray[i]);
    }
    return layouts;
}

bool IsKeyboardLayoutInstalled(HKL layout) {
    std::vector<HKL> layouts = GetInstalledKeyboardLayouts();
    return std::find(layouts.begin(), layouts.end(), layout) != layouts.end();
}

HKL GetCurrentKeyboardLayout() {
    return GetKeyboardLayout(0);
}

HKL GetKeyboardLayoutForLanguage(const char* languageCode) {
    std::string lang(languageCode);
    auto it = LAYOUT_MAP.find(lang);
    
    if (it != LAYOUT_MAP.end()) {
        // Try to load the layout
        HKL layout = LoadKeyboardLayoutA(it->second.c_str(), KLF_ACTIVATE | KLF_SUBSTITUTE_OK);
        if (layout && IsKeyboardLayoutInstalled(layout)) {
            return layout;
        }
    }
    
    // If we couldn't load the specific layout, try to find a compatible one
    std::vector<HKL> layouts = GetInstalledKeyboardLayouts();
    for (HKL layout : layouts) {
        char layoutName[KL_NAMELENGTH];
        if (GetKeyboardLayoutNameA(layoutName)) {
            std::string name(layoutName);
            // Check if this layout matches our language code
            if (name.find(it->second) != std::string::npos) {
                return layout;
            }
        }
    }
    
    // Default to current layout if no matching layout found
    return GetCurrentKeyboardLayout();
}

bool SetThreadKeyboardLayout(HKL layout) {
    if (!layout) return false;

    // First, check if the layout is installed
    if (!IsKeyboardLayoutInstalled(layout)) {
        return false;
    }

    // Get the foreground window which represents active application
    HWND foreground = GetForegroundWindow();
    if (foreground) {
        // Get the thread of the foreground window
        DWORD threadId = GetWindowThreadProcessId(foreground, NULL);
        // Attach our thread input to the foreground window's thread
        if (AttachThreadInput(GetCurrentThreadId(), threadId, TRUE)) {
            // Set layout for the foreground window's thread
            SystemParametersInfo(SPI_SETDEFAULTINPUTLANG, 0, &layout, SPIF_SENDCHANGE);
            PostMessage(foreground, WM_INPUTLANGCHANGEREQUEST, 0, (LPARAM)layout);
            // Detach thread input
            AttachThreadInput(GetCurrentThreadId(), threadId, FALSE);
        }
    }

    // Also set for our thread
    ActivateKeyboardLayout(layout, KLF_SETFORPROCESS | KLF_REORDER);
    
    return true;
}

HKL SaveAndSetKeyboardLayout(HKL newLayout) {
    HKL currentLayout = GetCurrentKeyboardLayout();
    SetThreadKeyboardLayout(newLayout);
    return currentLayout;
}

void RestoreKeyboardLayout(HKL savedLayout) {
    SetThreadKeyboardLayout(savedLayout);
}

const char* DetectLanguageFromChar(wchar_t ch) {
    if (ch <= 0x007F) return "en";                    // ASCII (English)
    else if (ch >= 0x0400 && ch <= 0x04FF) return "ru"; // Cyrillic
    else if (ch >= 0x0500 && ch <= 0x052F) return "uk"; // Ukrainian
    else if (ch >= 0x00C0 && ch <= 0x00FF) {          // Latin-1 Supplement
        if (ch >= 0x00C0 && ch <= 0x00C5) return "fr";  // French
        if (ch >= 0x00D6 && ch <= 0x00DC) return "de";  // German
        return "en";
    }
    else if (ch >= 0x3040 && ch <= 0x309F) return "ja"; // Hiragana
    else if (ch >= 0x30A0 && ch <= 0x30FF) return "ja"; // Katakana
    else if (ch >= 0x4E00 && ch <= 0x9FFF) return "zh"; // CJK
    else if (ch >= 0xAC00 && ch <= 0xD7AF) return "ko"; // Korean
    return "en"; // Default to English
}

bool GetVirtualKeyForChar(wchar_t ch, HKL layout, UINT* virtualKey, UINT* modifiers) {
    SHORT vk = VkKeyScanExW(ch, layout);
    if (vk == -1) return false;

    *virtualKey = LOBYTE(vk);
    *modifiers = HIBYTE(vk);
    return true;
}

bool isCapsLockEnabled() {
    return (GetKeyState(VK_CAPITAL) & 0x0001) != 0;
}

void ensureCapsLockDisabled() {
    if (isCapsLockEnabled()) {
        // Simulate pressing and releasing Caps Lock
        INPUT input[2] = {};
        input[0].type = INPUT_KEYBOARD;
        input[0].ki.wVk = VK_CAPITAL;
        input[0].ki.dwFlags = 0;

        input[1].type = INPUT_KEYBOARD;
        input[1].ki.wVk = VK_CAPITAL;
        input[1].ki.dwFlags = KEYEVENTF_KEYUP;

        SendInput(2, input, sizeof(INPUT));
        Sleep(50); // Small delay to ensure the state change takes effect
    }
}
