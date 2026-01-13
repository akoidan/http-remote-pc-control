#include "./headers/keyboard-layout.h"

#include <napi.h>
#include <unordered_map>
#include <string>
#include <vector>
#include <winnls.h>
#include "./headers/logger.h"

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
  {"en", MakeKLID(MAKELANGID(LANG_ENGLISH, SUBLANG_ENGLISH_US))}, // US English
  {"ru", MakeKLID(MAKELANGID(LANG_RUSSIAN, SUBLANG_RUSSIAN_RUSSIA))}, // Russian
  {"uk", MakeKLID(MAKELANGID(LANG_UKRAINIAN, SUBLANG_DEFAULT))}, // Ukrainian
  {"de", MakeKLID(MAKELANGID(LANG_GERMAN, SUBLANG_GERMAN))}, // German
  {"fr", MakeKLID(MAKELANGID(LANG_FRENCH, SUBLANG_FRENCH))}, // French
  {"es", MakeKLID(MAKELANGID(LANG_SPANISH, SUBLANG_SPANISH))}, // Spanish
  {"it", MakeKLID(MAKELANGID(LANG_ITALIAN, SUBLANG_ITALIAN))}, // Italian
  {"pt", MakeKLID(MAKELANGID(LANG_PORTUGUESE, SUBLANG_PORTUGUESE))}, // Portuguese
  {"pl", MakeKLID(MAKELANGID(LANG_POLISH, SUBLANG_DEFAULT))}, // Polish
  {"cs", MakeKLID(MAKELANGID(LANG_CZECH, SUBLANG_DEFAULT))}, // Czech
  {"ja", MakeKLID(MAKELANGID(LANG_JAPANESE, SUBLANG_DEFAULT))}, // Japanese
  {"ko", MakeKLID(MAKELANGID(LANG_KOREAN, SUBLANG_KOREAN))}, // Korean
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

// Set keyboard layout by layout ID string (e.g., "00000409" for US English)
void SetKeyboardLayout(const char* layoutId, const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!layoutId || strlen(layoutId) == 0) {
    throw Napi::Error::New(env, "Invalid parameter lang code");
  }

  // Convert the layout ID string to HKL
  HKL hkl = reinterpret_cast<HKL>(static_cast<UINT_PTR>(strtoul(layoutId, nullptr, 16)));

  // Get the current foreground window and its thread
  HWND foregroundWnd = GetForegroundWindow();
  if (!foregroundWnd) {
    throw Napi::Error::New(env, "NO FG window");
  }

  DWORD threadId = GetWindowThreadProcessId(foregroundWnd, nullptr);
  if (!threadId) {
    throw Napi::Error::New(env, "NO FG thread id");
  }

  // Attach to the thread that owns the foreground window
  DWORD currentThreadId = GetCurrentThreadId();
  DWORD currentThread = GetCurrentThreadId();
  DWORD targetThread = threadId;

  // If we're not already attached to the target thread, attach to it
  bool attached = false;
  if (currentThread != targetThread) {
    attached = AttachThreadInput(currentThread, targetThread, TRUE) != 0;
  }

  // Try to set the keyboard layout
  HKL previousLayout = GetKeyboardLayout(targetThread);
  HKL result = ActivateKeyboardLayout(hkl, 0);

  // If activation failed, try to load and activate the layout
  if (result == nullptr) {
    // Try to load the layout
    HKL loadedLayout = LoadKeyboardLayoutA(layoutId, KLF_ACTIVATE | KLF_SETFORPROCESS);
    if (loadedLayout) {
      result = loadedLayout;
    }
  }

  // If we attached to the thread, detach now
  if (attached) {
    AttachThreadInput(currentThread, targetThread, FALSE);
  }

  // If we successfully changed the layout, send WM_INPUTLANGCHANGEREQUEST
  if (result && result != previousLayout) {
    // Notify applications that the input language has changed
    PostMessage(HWND_BROADCAST, WM_INPUTLANGCHANGEREQUEST, 0, reinterpret_cast<LPARAM>(result));
  }

  if (result == nullptr) {
    throw Napi::Error::New(env, "NO FG window");
  }
}

const char* DetectLanguageFromChar(wchar_t ch) {
  if (ch <= 0x007F) return "en"; // ASCII (English)
  else if (ch >= 0x0400 && ch <= 0x04FF) return "ru"; // Cyrillic
  else if (ch >= 0x0500 && ch <= 0x052F) return "uk"; // Ukrainian
  else if (ch >= 0x00C0 && ch <= 0x00FF) {
    // Latin-1 Supplement
    if (ch >= 0x00C0 && ch <= 0x00C5) return "fr"; // French
    if (ch >= 0x00D6 && ch <= 0x00DC) return "de"; // German
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
    LOG("Caps Lock is ON, turning it OFF to ensure correct typing");
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