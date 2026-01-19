#include <napi.h>
#include <unistd.h>
#include <xcb/xcb_ewmh.h>
#include "./headers/window.h"
#include "./headers/logger.h"


// Global XCB connection
static xcb_connection_t* connection = nullptr;
static xcb_ewmh_connection_t ewmh;
static xcb_window_t root_window;


// Helper function to get process path from PID
std::string get_process_path(pid_t pid, Napi::Env env) {
    if (pid <= 0) {
        throw Napi::Error::New(env, "Invalid pid");
    }

    char path[1024];
    char proc_path[1024];
    snprintf(proc_path, sizeof(proc_path), "/proc/%d/exe", pid);

    ssize_t len = readlink(proc_path, path, sizeof(path) - 1);
    if (len == -1) {
        throw Napi::Error::New(env, "Failed to get process path");
    }
    path[len] = '\0';
    return std::string(path);
}


// Initialize XCB if not already initialized
void ensure_xcb_initialized(Napi::Env env) {
    if (connection) {
        return;
    }
    int screen_num;
    connection = xcb_connect(nullptr, &screen_num);

    if (int error = xcb_connection_has_error(connection)) {
        std::string errorMsg;
        switch (error) {
        case XCB_CONN_ERROR:
            errorMsg = "Connection error: socket, pipe, or stream error";
            break;
        case XCB_CONN_CLOSED_EXT_NOTSUPPORTED:
            errorMsg = "Connection closed: required extension not supported";
            break;
        case XCB_CONN_CLOSED_MEM_INSUFFICIENT:
            errorMsg = "Connection closed: insufficient memory";
            break;
        case XCB_CONN_CLOSED_REQ_LEN_EXCEED:
            errorMsg = "Connection closed: request length exceeded server limit";
            break;
        case XCB_CONN_CLOSED_PARSE_ERR:
            errorMsg = "Connection closed: error parsing display string";
            break;
        case XCB_CONN_CLOSED_INVALID_SCREEN:
            errorMsg = "Connection closed: no matching screen found on X server";
            break;
        default:
            errorMsg = "Unknown connection error";
        }
        xcb_disconnect(connection);
        connection = nullptr;
        throw Napi::Error::New(env, "Failed to connect to X server: " + errorMsg);
    }

    xcb_screen_t* screen = xcb_setup_roots_iterator(xcb_get_setup(connection)).data;
    root_window = screen->root;

    if (xcb_ewmh_init_atoms_replies(&ewmh, xcb_ewmh_init_atoms(connection, &ewmh), nullptr) == 0) {
        xcb_disconnect(connection);
        connection = nullptr;
        throw Napi::Error::New(env, "Failed to initialize EWMH atoms");
    }

    LOG("XCB initialized successfully");
}

// Get PID for a window
pid_t get_window_pid(xcb_window_t window, Napi::Env env) {
    ensure_xcb_initialized(env);

    xcb_get_property_cookie_t cookie = xcb_get_property(connection, 0, window,
                                                        ewmh._NET_WM_PID, XCB_ATOM_CARDINAL, 0, 1);

    xcb_get_property_reply_t* reply = xcb_get_property_reply(connection, cookie, nullptr);
    if (!reply) {
        throw Napi::Error::New(env, "Failed to get reply from XCB connection");
    };

    pid_t pid = 0;
    if (reply->type == XCB_ATOM_CARDINAL && reply->format == 32 && reply->length == 1) {
        pid = *(pid_t*)xcb_get_property_value(reply);
        free(reply);
    }
    else {
        free(reply);
        throw Napi::Error::New(env, "Failed to get PID from XCB reply");
    }
    return pid;
}

// Get active window
xcb_window_t get_active_window(Napi::Env env) {
    ensure_xcb_initialized(env);

    xcb_get_property_cookie_t cookie = xcb_ewmh_get_active_window(&ewmh, 0);
    xcb_window_t active_window = 0;

    if (!xcb_ewmh_get_active_window_reply(&ewmh, cookie, &active_window, nullptr)) {
        throw Napi::Error::New(env, "Failed to get active window");
    }
    return active_window;
}

// Get all windows
std::vector<WindowInfo> get_all_windows(Napi::Env env) {
    std::vector<WindowInfo> windows;
    ensure_xcb_initialized(env);

    xcb_get_property_cookie_t cookie = xcb_ewmh_get_client_list(&ewmh, 0);
    xcb_ewmh_get_windows_reply_t clients;

    if (!xcb_ewmh_get_client_list_reply(&ewmh, cookie, &clients, nullptr)) {
        throw Napi::Error::New(env, "Failed to get client list");
    }
    for (unsigned int i = 0; i < clients.windows_len; i++) {
        pid_t pid = get_window_pid(clients.windows[i], env);
        if (pid > 0) {
            WindowInfo info = {clients.windows[i], pid};
            windows.push_back(info);
            LOG("Found window - ID: %lu, PID: %d", (unsigned long)clients.windows[i], pid);
        }
    }
    xcb_ewmh_get_windows_reply_wipe(&clients);

    return windows;
}

Napi::Array getWindows(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto windows = get_all_windows(env);

    auto arr = Napi::Array::New(env);
    for (size_t i = 0; i < windows.size(); i++) {
        arr.Set(i, Napi::Number::New(env, static_cast<int64_t>(windows[i].id)));
    }
    return arr;
}

Napi::Object initWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    xcb_window_t window_id = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    LOG("Window ID: %lu", (unsigned long)window_id);

    pid_t pid = get_window_pid(window_id, env);
    std::string path = get_process_path(pid, env);

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("processId", Napi::Number::New(env, pid));
    obj.Set("path", Napi::String::New(env, path));

    return obj;
}

void bringWindowToTop(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    ensure_xcb_initialized(env);

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
}

Napi::Number getActiveWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    xcb_window_t active_window = get_active_window(env);
    return Napi::Number::New(env, static_cast<int64_t>(active_window));
}

Napi::Object getActiveWindowInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    xcb_window_t window_id = get_active_window(env);
    pid_t pid = get_window_pid(window_id, env);
    std::string path = get_process_path(pid, env);

    Napi::Object result = Napi::Object::New(env);
    result.Set("wid", Napi::Number::New(env, static_cast<int64_t>(window_id)));
    result.Set("pid", Napi::Number::New(env, pid));
    result.Set("path", Napi::String::New(env, path));

    return result;
}

void setWindowBounds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    ensure_xcb_initialized(env);

    xcb_window_t window_id = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());

    Napi::Object bounds = info[1].As<Napi::Object>();
    int x = bounds.Get("x").ToNumber().Int32Value();
    int y = bounds.Get("y").ToNumber().Int32Value();
    int width = bounds.Get("width").ToNumber().Int32Value();
    int height = bounds.Get("height").ToNumber().Int32Value();

    if (width <= 0 || height <= 0) {
        throw Napi::Error::New(env, "Invalid window dimensions");
    }

    uint32_t values[] = {(uint32_t)x, (uint32_t)y, (uint32_t)width, (uint32_t)height};
    xcb_configure_window(
        connection, window_id,
        XCB_CONFIG_WINDOW_X | XCB_CONFIG_WINDOW_Y | XCB_CONFIG_WINDOW_WIDTH | XCB_CONFIG_WINDOW_HEIGHT,
        values
    );
    xcb_flush(connection);
}

Napi::Object window_init(Napi::Env env, Napi::Object exports) {
    exports.Set("getWindows", Napi::Function::New(env, getWindows));
    exports.Set("initWindow", Napi::Function::New(env, initWindow));
    exports.Set("bringWindowToTop", Napi::Function::New(env, bringWindowToTop));
    exports.Set("getActiveWindow", Napi::Function::New(env, getActiveWindow));
    exports.Set("getActiveWindowInfo", Napi::Function::New(env, getActiveWindowInfo));
    exports.Set("setWindowBounds", Napi::Function::New(env, setWindowBounds));
    return exports;
}
