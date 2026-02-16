#include <napi.h>
#include <unordered_map>
#include <string>
#include <vector>
#include "./headers/logger.h"
#include "./headers/keyboard-layout.h"

// Helper function to create keyboard layout string from LANGID
std::string makeKLID(LANGID langId) {
  char klid[KL_NAMELENGTH];
  sprintf_s(klid, KL_NAMELENGTH, "%08x", MAKELCID(langId, SORT_DEFAULT));
  return std::string(klid);
}

// Helper function to get foreground window's layout
HKL getSystemKeyboardLayout() {
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
  {"en", makeKLID(MAKELANGID(LANG_ENGLISH, SUBLANG_ENGLISH_US))}, // US English
  {"ru", makeKLID(MAKELANGID(LANG_RUSSIAN, SUBLANG_RUSSIAN_RUSSIA))}, // Russian
  {"uk", makeKLID(MAKELANGID(LANG_UKRAINIAN, SUBLANG_DEFAULT))}, // Ukrainian
  {"de", makeKLID(MAKELANGID(LANG_GERMAN, SUBLANG_GERMAN))}, // German
  {"fr", makeKLID(MAKELANGID(LANG_FRENCH, SUBLANG_FRENCH))}, // French
  {"es", makeKLID(MAKELANGID(LANG_SPANISH, SUBLANG_SPANISH))}, // Spanish
  {"it", makeKLID(MAKELANGID(LANG_ITALIAN, SUBLANG_ITALIAN))}, // Italian
  {"pt", makeKLID(MAKELANGID(LANG_PORTUGUESE, SUBLANG_PORTUGUESE))}, // Portuguese
  {"pl", makeKLID(MAKELANGID(LANG_POLISH, SUBLANG_DEFAULT))}, // Polish
  {"cs", makeKLID(MAKELANGID(LANG_CZECH, SUBLANG_DEFAULT))}, // Czech
  {"ja", makeKLID(MAKELANGID(LANG_JAPANESE, SUBLANG_DEFAULT))}, // Japanese
  {"ko", makeKLID(MAKELANGID(LANG_KOREAN, SUBLANG_KOREAN))}, // Korean
  {"zh", makeKLID(MAKELANGID(LANG_CHINESE_SIMPLIFIED, SUBLANG_CHINESE_SIMPLIFIED))} // Chinese (Simplified)
};

std::vector<HKL> getInstalledKeyboardLayouts() {
  std::vector<HKL> layouts;
  HKL hklArray[256];
  UINT count = GetKeyboardLayoutList(256, hklArray);
  for (UINT i = 0; i < count; i++) {
    layouts.push_back(hklArray[i]);
  }
  return layouts;
}

bool isKeyboardLayoutInstalled(HKL layout) {
  std::vector<HKL> layouts = getInstalledKeyboardLayouts();
  return std::find(layouts.begin(), layouts.end(), layout) != layouts.end();
}

HKL getCurrentKeyboardLayout() {
  return GetKeyboardLayout(0);
}

HKL getKeyboardLayoutForLanguage(const char *languageCode) {
  std::string lang(languageCode);
  auto it = LAYOUT_MAP.find(lang);

  if (it != LAYOUT_MAP.end()) {
    // Try to load the layout
    HKL layout = LoadKeyboardLayoutA(it->second.c_str(), KLF_ACTIVATE | KLF_SUBSTITUTE_OK);
    if (layout && isKeyboardLayoutInstalled(layout)) {
      return layout;
    }
  }

  // If we couldn't load the specific layout, try to find a compatible one
  std::vector<HKL> layouts = getInstalledKeyboardLayouts();
  for (HKL layout: layouts) {
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
  return getCurrentKeyboardLayout();
}

void setThreadKeyboardLayout(HKL layout, Napi::Env env) {
  if (!layout) {
    throw Napi::Error::New(env, "Cannot set null layout");
  };

  // First, check if the layout is installed
  if (!isKeyboardLayoutInstalled(layout)) {
    throw Napi::Error::New(env, "Current keyboard layout is not installed or not found");
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
      PostMessage(foreground, WM_INPUTLANGCHANGEREQUEST, 0, (LPARAM) layout);
      // Detach thread input
      AttachThreadInput(GetCurrentThreadId(), threadId, FALSE);
    }
  }

  // Also set for our thread
  ActivateKeyboardLayout(layout, KLF_SETFORPROCESS | KLF_REORDER);
}

HKL saveAndSetKeyboardLayout(HKL newLayout, Napi::Env env) {
  HKL currentLayout = getCurrentKeyboardLayout();
  setThreadKeyboardLayout(newLayout, env);
  return currentLayout;
}

void restoreKeyboardLayout(HKL savedLayout, Napi::Env env) {
  setThreadKeyboardLayout(savedLayout, env);
}

// Set keyboard layout by layout ID string (e.g., "00000409" for US English)
void setKeyboardLayoutImpl(const char *layoutId, Napi::Env env) {
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

const char *detectLanguageFromChar(wchar_t ch) {
  if (ch <= 0x007F) return "en"; // ASCII (English)
  else if (ch >= 0x0400 && ch <= 0x04FF) return "ru"; // Cyrillic
  else if (ch >= 0x0500 && ch <= 0x052F) return "uk"; // Ukrainian
  else if (ch >= 0x00C0 && ch <= 0x00FF) {
    // Latin-1 Supplement
    if (ch >= 0x00C0 && ch <= 0x00C5) return "fr"; // French
    if (ch >= 0x00D6 && ch <= 0x00DC) return "de"; // German
    return "en";
  } else if (ch >= 0x3040 && ch <= 0x309F) return "ja"; // Hiragana
  else if (ch >= 0x30A0 && ch <= 0x30FF) return "ja"; // Katakana
  else if (ch >= 0x4E00 && ch <= 0x9FFF) return "zh"; // CJK
  else if (ch >= 0xAC00 && ch <= 0xD7AF) return "ko"; // Korean
  return "en"; // Default to English
}

void getVirtualKeyForChar(wchar_t ch, HKL layout, UINT *virtualKey, UINT *modifiers, Napi::Env env) {
  SHORT vk = VkKeyScanExW(ch, layout);
  if (vk == -1) {
    throw Napi::Error::New(env, "Unable to map character to virtual key");
  };

  *virtualKey = LOBYTE(vk);
  *modifiers = HIBYTE(vk);
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
