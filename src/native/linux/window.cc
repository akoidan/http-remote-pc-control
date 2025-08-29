#include <napi.h>
#include <stdio.h>
#include <unistd.h>
#include <vector>
#include <string>
#include <cstring>
#include <xcb/xcb.h>
#include <xcb/xcb_ewmh.h>
#include "./headers/window.h"

#define DEBUG_LOG(fmt, ...) fprintf(stderr, "[window-linux] " fmt "\n", ##__VA_ARGS__)

struct WindowInfo {
    xcb_window_t id;
    pid_t pid;
};

// Helper function to get process path from PID
std::string get_process_path(pid_t pid) {
    if (pid <= 0) return "";

    char path[1024];
    char proc_path[1024];
    snprintf(proc_path, sizeof(proc_path), "/proc/%d/exe", pid);

    ssize_t len = readlink(proc_path, path, sizeof(path)-1);
    if (len != -1) {
        path[len] = '\0';
        return std::string(path);
    }
    return "";
}

// Global XCB connection
static xcb_connection_t* connection = nullptr;
static xcb_ewmh_connection_t ewmh;
static xcb_window_t root_window;

// Initialize XCB if not already initialized
bool ensure_xcb_initialized() {
    if (!connection) {
        int screen_num;
        connection = xcb_connect(nullptr, &screen_num);
        if (xcb_connection_has_error(connection)) {
            DEBUG_LOG("Failed to connect to X server");
            return false;
        }

        xcb_screen_t* screen = xcb_setup_roots_iterator(xcb_get_setup(connection)).data;
        root_window = screen->root;

        if (xcb_ewmh_init_atoms_replies(&ewmh, xcb_ewmh_init_atoms(connection, &ewmh), nullptr) == 0) {
            DEBUG_LOG("Failed to initialize EWMH atoms");
            xcb_disconnect(connection);
            connection = nullptr;
            return false;
        }

        DEBUG_LOG("XCB initialized successfully");
    }
    return true;
}

// Get PID for a window
pid_t get_window_pid(xcb_window_t window) {
    if (!ensure_xcb_initialized()) return 0;

    xcb_get_property_cookie_t cookie = xcb_get_property(connection, 0, window,
        ewmh._NET_WM_PID, XCB_ATOM_CARDINAL, 0, 1);

    xcb_get_property_reply_t* reply = xcb_get_property_reply(connection, cookie, nullptr);
    if (!reply) return 0;

    pid_t pid = 0;
    if (reply->type == XCB_ATOM_CARDINAL && reply->format == 32 && reply->length == 1) {
        pid = *(pid_t*)xcb_get_property_value(reply);
    }

    free(reply);
    return pid;
}

// Get active window
xcb_window_t get_active_window() {
    if (!ensure_xcb_initialized()) return 0;

    xcb_get_property_cookie_t cookie = xcb_ewmh_get_active_window(&ewmh, 0);
    xcb_window_t active_window = 0;

    if (xcb_ewmh_get_active_window_reply(&ewmh, cookie, &active_window, nullptr)) {
        DEBUG_LOG("Active window ID: %lu", (unsigned long)active_window);
        return active_window;
    }

    DEBUG_LOG("Failed to get active window");
    return 0;
}

// Get all windows
std::vector<WindowInfo> get_all_windows() {
    std::vector<WindowInfo> windows;
    if (!ensure_xcb_initialized()) return windows;

    xcb_get_property_cookie_t cookie = xcb_ewmh_get_client_list(&ewmh, 0);
    xcb_ewmh_get_windows_reply_t clients;

    if (xcb_ewmh_get_client_list_reply(&ewmh, cookie, &clients, nullptr)) {
        for (unsigned int i = 0; i < clients.windows_len; i++) {
            pid_t pid = get_window_pid(clients.windows[i]);
            if (pid > 0) {
                WindowInfo info = {clients.windows[i], pid};
                windows.push_back(info);
                DEBUG_LOG("Found window - ID: %lu, PID: %d", (unsigned long)clients.windows[i], pid);
            }
        }
        xcb_ewmh_get_windows_reply_wipe(&clients);
    }

    return windows;
}

Napi::Array getWindows(const Napi::CallbackInfo& info) {
    DEBUG_LOG("getWindows called");
    Napi::Env env = info.Env();
    auto windows = get_all_windows();

    auto arr = Napi::Array::New(env);
    for (size_t i = 0; i < windows.size(); i++) {
        arr.Set(i, Napi::Number::New(env, static_cast<int64_t>(windows[i].id)));
    }

    DEBUG_LOG("Returning %zu windows", windows.size());
    return arr;
}

Napi::Object initWindow(const Napi::CallbackInfo& info) {
    DEBUG_LOG("initWindow called");
    Napi::Env env = info.Env();

    xcb_window_t window_id = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    DEBUG_LOG("Window ID: %lu", (unsigned long)window_id);

    pid_t pid = get_window_pid(window_id);
    std::string path = get_process_path(pid);
    DEBUG_LOG("Result - PID: %d, Path: %s", pid, path.c_str());

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("processId", Napi::Number::New(env, pid));
    obj.Set("path", Napi::String::New(env, path));

    return obj;
}

Napi::Boolean bringWindowToTop(const Napi::CallbackInfo& info) {
    DEBUG_LOG("bringWindowToTop called");
    Napi::Env env = info.Env();

    if (!ensure_xcb_initialized()) {
        return Napi::Boolean::New(env, false);
    }

    xcb_window_t window_id = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());

    // Send _NET_ACTIVE_WINDOW message
    xcb_client_message_event_t event;
    memset(&event, 0, sizeof(event));

    event.response_type = XCB_CLIENT_MESSAGE;
    event.format = 32;
    event.window = window_id;
    event.type = ewmh._NET_ACTIVE_WINDOW;
    event.data.data32[0] = 2; // Source indication: 2 = pager
    event.data.data32[1] = XCB_CURRENT_TIME;
    event.data.data32[2] = XCB_NONE;

    xcb_send_event(connection, 0, root_window,
                   XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY | XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT,
                   (const char*)&event);

    // Also use traditional method as fallback
    uint32_t values[] = {XCB_STACK_MODE_ABOVE};
    xcb_configure_window(connection, window_id, XCB_CONFIG_WINDOW_STACK_MODE, values);
    xcb_set_input_focus(connection, XCB_INPUT_FOCUS_POINTER_ROOT, window_id, XCB_CURRENT_TIME);
    xcb_flush(connection);

    DEBUG_LOG("Window activation request sent");
    return Napi::Boolean::New(env, true);
}

Napi::Number getActiveWindow(const Napi::CallbackInfo& info) {
    DEBUG_LOG("getActiveWindow called");
    Napi::Env env = info.Env();
    xcb_window_t active = get_active_window();
    return Napi::Number::New(env, static_cast<int64_t>(active));
}

Napi::Object getActiveWindowInfo(const Napi::CallbackInfo& info) {
    DEBUG_LOG("getActiveWindowInfo called");
    Napi::Env env = info.Env();

    xcb_window_t window = get_active_window();
    pid_t pid = get_window_pid(window);
    std::string path = get_process_path(pid);

    DEBUG_LOG("Active window - ID: %lu, PID: %d, Path: %s", 
              (unsigned long)window, pid, path.c_str());

    Napi::Object result = Napi::Object::New(env);
    result.Set("wid", Napi::Number::New(env, static_cast<int64_t>(window)));
    result.Set("pid", Napi::Number::New(env, pid));
    result.Set("path", Napi::String::New(env, path));

    return result;
}

Napi::Object window_init(Napi::Env env, Napi::Object exports) {
    DEBUG_LOG("Initializing window.cc");
    exports.Set("getWindows", Napi::Function::New(env, getWindows));
    exports.Set("initWindow", Napi::Function::New(env, initWindow));
    exports.Set("bringWindowToTop", Napi::Function::New(env, bringWindowToTop));
    exports.Set("getActiveWindow", Napi::Function::New(env, getActiveWindow));
    exports.Set("getActiveWindowInfo", Napi::Function::New(env, getActiveWindowInfo));
    return exports;
}
