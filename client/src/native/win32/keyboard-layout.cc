#include "./headers/keyboard-layout.h"
#include <unordered_map>
#include <string>
#include <vector>

// Map of common language codes to their keyboard layout IDs
static const std::unordered_map<std::string, std::string> LAYOUT_MAP = {
    {"en", "00000409"},    // US English
    {"ru", "00000419"},    // Russian
    {"uk", "00000422"},    // Ukrainian
    {"de", "00000407"},    // German
    {"fr", "0000040C"},    // French
    {"es", "0000040A"},    // Spanish
    {"it", "00000410"},    // Italian
    {"pt", "00000416"},    // Portuguese
    {"pl", "00000415"},    // Polish
    {"cs", "00000405"},    // Czech
    {"ja", "00000411"},    // Japanese
    {"ko", "00000412"},    // Korean
    {"zh", "00000804"},    // Chinese (Simplified)
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

    // Force layout change with multiple flags
    if (!ActivateKeyboardLayout(layout, KLF_SETFORPROCESS | KLF_REORDER)) {
        return false;
    }

    // Notify all windows of the layout change
    PostMessage(HWND_BROADCAST, WM_INPUTLANGCHANGEREQUEST, 0, (LPARAM)layout);
    
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
