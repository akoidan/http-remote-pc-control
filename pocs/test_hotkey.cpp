#define UNICODE
#define _UNICODE
#include <windows.h>
#include <iostream>

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_HOTKEY) {
        std::cout << "Hotkey pressed! ID: " << wParam << std::endl;
        return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

int main() {
    // Register window class
    const wchar_t CLASS_NAME[] = L"HotkeyTest";
    WNDCLASSW wc = {};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = GetModuleHandle(NULL);
    wc.lpszClassName = CLASS_NAME;
    
    if (!RegisterClassW(&wc)) {
        std::cout << "Failed to register window class. Error: " << GetLastError() << std::endl;
        return 1;
    }

    // Create hidden window
    HWND hwnd = CreateWindowExW(
        0,                              // Optional window styles
        CLASS_NAME,                     // Window class
        L"Hotkey Test",                // Window text
        WS_OVERLAPPED,                 // Window style
        0, 0, 0, 0,                    // Position and size
        NULL,                          // Parent window
        NULL,                          // Menu
        GetModuleHandle(NULL),         // Instance handle
        NULL                           // Additional application data
    );

    if (hwnd == NULL) {
        std::cout << "Failed to create window. Error: " << GetLastError() << std::endl;
        return 1;
    }

    std::cout << "Window created: " << std::hex << hwnd << std::dec << std::endl;

    // Register Alt+1 hotkey
    if (!RegisterHotKey(hwnd, 1, MOD_ALT, '1')) {
        std::cout << "Failed to register hotkey. Error: " << GetLastError() << std::endl;
        return 1;
    }

    std::cout << "Hotkey registered successfully. Press Alt+1..." << std::endl;

    // Message loop
    MSG msg = {};
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return 0;
}
