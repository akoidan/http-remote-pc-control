#include <napi.h>
#include <stdio.h>
#include <unistd.h>
#include <vector>
#include <string>
#include <cstring>
#include <xcb/xcb.h>
#include <xcb/xcb_ewmh.h>
#include "./headers/window.h"
#include "./headers/logger.h"

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
            LOG("Failed to connect to X server");
            return false;
        }

        xcb_screen_t* screen = xcb_setup_roots_iterator(xcb_get_setup(connection)).data;
        root_window = screen->root;

        if (xcb_ewmh_init_atoms_replies(&ewmh, xcb_ewmh_init_atoms(connection, &ewmh), nullptr) == 0) {
            LOG("Failed to initialize EWMH atoms");
            xcb_disconnect(connection);
            connection = nullptr;
            return false;
        }

        LOG("XCB initialized successfully");
    }
    return true;
}

// Get PID for a window
pid_t get_window_pid(xcb_window_t window) {
    if (!ensure_xcb_initialized()) {
        LOG("XCB not inited !!! :(");
        return 0;
    }

    xcb_get_property_cookie_t cookie = xcb_get_property(connection, 0, window,
        ewmh._NET_WM_PID, XCB_ATOM_CARDINAL, 0, 1);

    xcb_get_property_reply_t* reply = xcb_get_property_reply(connection, cookie, nullptr);
    if (!reply) {
        LOG("XCB not didnt put a proper reply for window propertyy !!! :(");
        return 0;
    }

    pid_t pid = 0;
    if (reply->type == XCB_ATOM_CARDINAL && reply->format == 32 && reply->length == 1) {
        pid = *(pid_t*)xcb_get_property_value(reply);
    } else {
        LOG("Unknow XCB reply !! :( ");
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
        LOG("Active window ID: " << (unsigned long)active_window);
        return active_window;
    }

    LOG("Failed to get active window");
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
                LOG("Found window - ID: " << (unsigned long)clients.windows[i] << ", PID: " << pid);
            }
        }
        xcb_ewmh_get_windows_reply_wipe(&clients);
    }

    return windows;
}

Napi::Array getWindows(const Napi::CallbackInfo& info) {
    LOG("getWindows called");
    Napi::Env env = info.Env();
    auto windows = get_all_windows();

    auto arr = Napi::Array::New(env);
    for (size_t i = 0; i < windows.size(); i++) {
        arr.Set(i, Napi::Number::New(env, static_cast<int64_t>(windows[i].id)));
    }

    LOG("Returning " << windows.size() << " windows");
    return arr;
}

Napi::Object initWindow(const Napi::CallbackInfo& info) {
    LOG("initWindow called");
    Napi::Env env = info.Env();

    xcb_window_t window_id = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    LOG("Window ID: " << (unsigned long)window_id);

    pid_t pid = get_window_pid(window_id);
    std::string path = get_process_path(pid);
    LOG("Result - PID: " << pid << ", Path: " << path);

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("processId", Napi::Number::New(env, pid));
    obj.Set("path", Napi::String::New(env, path));

    return obj;
}

Napi::Value bringWindowToTop(const Napi::CallbackInfo& info) {
    LOG("bringWindowToTop called");
    Napi::Env env = info.Env();

    if (!ensure_xcb_initialized()) {
        throw Napi::Error::New(env, "XCB initialization failed");
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

    LOG("Window activation request sent");
    return env.Undefined();
}

Napi::Number getActiveWindow(const Napi::CallbackInfo& info) {
    LOG("getActiveWindow called");
    Napi::Env env = info.Env();
    xcb_window_t active = get_active_window();
    return Napi::Number::New(env, static_cast<int64_t>(active));
}

Napi::Object getActiveWindowInfo(const Napi::CallbackInfo& info) {
    LOG("getActiveWindowInfo called");
    Napi::Env env = info.Env();

    xcb_window_t window = get_active_window();
    pid_t pid = get_window_pid(window);
    std::string path = get_process_path(pid);

    LOG("Active window - ID: " << (unsigned long)window << ", PID: " << pid << ", Path: " << path);

    Napi::Object result = Napi::Object::New(env);
    result.Set("wid", Napi::Number::New(env, static_cast<int64_t>(window)));
    result.Set("pid", Napi::Number::New(env, pid));
    result.Set("path", Napi::String::New(env, path));

    return result;
}

// Additional helpers for properties
static xcb_atom_t intern_atom(const char* name) {
    if (!ensure_xcb_initialized()) return XCB_ATOM_NONE;
    xcb_intern_atom_cookie_t cookie = xcb_intern_atom(connection, 0, strlen(name), name);
    xcb_intern_atom_reply_t* reply = xcb_intern_atom_reply(connection, cookie, nullptr);
    if (!reply) return XCB_ATOM_NONE;
    xcb_atom_t atom = reply->atom;
    free(reply);
    return atom;
}

static Napi::Object getWindowBounds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());

    xcb_get_geometry_cookie_t gc = xcb_get_geometry(connection, win);
    xcb_get_geometry_reply_t* gr = xcb_get_geometry_reply(connection, gc, nullptr);
    if (!gr) return Napi::Object::New(env);

    // Translate coordinates to root
    int16_t x = gr->x;
    int16_t y = gr->y;
    xcb_translate_coordinates_cookie_t tc = xcb_translate_coordinates(connection, win, root_window, 0, 0);
    xcb_translate_coordinates_reply_t* tr = xcb_translate_coordinates_reply(connection, tc, nullptr);
    if (tr) {
        x = tr->dst_x;
        y = tr->dst_y;
        free(tr);
    }

    Napi::Object bounds = Napi::Object::New(env);
    bounds.Set("x", x);
    bounds.Set("y", y);
    bounds.Set("width", static_cast<int>(gr->width));
    bounds.Set("height", static_cast<int>(gr->height));
    free(gr);
    return bounds;
}

static Napi::String getWindowTitle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());

    // Try _NET_WM_NAME (UTF8_STRING)
    xcb_ewmh_get_utf8_strings_reply_t name_reply;
    if (xcb_ewmh_get_wm_name_reply(&ewmh, xcb_ewmh_get_wm_name(&ewmh, win), &name_reply, nullptr)) {
        std::string title;
        if (name_reply.strings && name_reply.strings_len > 0) {
            title.assign(name_reply.strings, name_reply.strings + name_reply.strings_len);
        }
        xcb_ewmh_get_utf8_strings_reply_wipe(&name_reply);
        return Napi::String::New(env, title);
    }

    // Fallback WM_NAME
    xcb_get_property_cookie_t c = xcb_get_property(connection, 0, win, XCB_ATOM_WM_NAME, XCB_ATOM_STRING, 0, 1024);
    xcb_get_property_reply_t* r = xcb_get_property_reply(connection, c, nullptr);
    if (!r) {
        throw Napi::Error::New(env, "Window with this id doesnt exist");
    }
    std::string title;
    int len = xcb_get_property_value_length(r);
    if (len > 0) title.assign((char*)xcb_get_property_value(r), len);
    free(r);
    return Napi::String::New(env, title);
}

static Napi::Number getWindowOpacity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    xcb_atom_t OPACITY = intern_atom("_NET_WM_WINDOW_OPACITY");
    xcb_get_property_cookie_t c = xcb_get_property(connection, 0, win, OPACITY, XCB_ATOM_CARDINAL, 0, 1);
    xcb_get_property_reply_t* r = xcb_get_property_reply(connection, c, nullptr);
    if (!r) return Napi::Number::New(env, 1.0);
    double result = 1.0;
    if (r->type == XCB_ATOM_CARDINAL && r->format == 32 && r->length >= 1) {
        uint32_t value = *(uint32_t*)xcb_get_property_value(r);
        // Value is 32-bit alpha (0..0xFFFFFFFF)
        result = (double)value / 4294967295.0;
    }
    free(r);
    return Napi::Number::New(env, result);
}

static Napi::Number getWindowOwner(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    // Use WM_TRANSIENT_FOR as an approximation of owner
    xcb_get_property_cookie_t c = xcb_get_property(connection, 0, win, XCB_ATOM_WM_TRANSIENT_FOR, XCB_ATOM_WINDOW, 0, 1);
    xcb_get_property_reply_t* r = xcb_get_property_reply(connection, c, nullptr);
    if (!r) return Napi::Number::New(env, 0);
    xcb_window_t owner = 0;
    if (r->type == XCB_ATOM_WINDOW && r->format == 32 && r->length >= 1) {
        owner = *(xcb_window_t*)xcb_get_property_value(r);
    }
    free(r);
    return Napi::Number::New(env, static_cast<int64_t>(owner));
}

static Napi::Boolean isWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    xcb_get_window_attributes_cookie_t c = xcb_get_window_attributes(connection, win);
    xcb_get_window_attributes_reply_t* r = xcb_get_window_attributes_reply(connection, c, nullptr);
    bool ok = r != nullptr;
    if (r) free(r);
    return Napi::Boolean::New(env, ok);
}

static Napi::Boolean isWindowVisible(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    xcb_get_window_attributes_cookie_t c = xcb_get_window_attributes(connection, win);
    xcb_get_window_attributes_reply_t* r = xcb_get_window_attributes_reply(connection, c, nullptr);
    bool visible = false;
    if (r) {
        visible = (r->map_state == XCB_MAP_STATE_VIEWABLE);
        free(r);
    }
    return Napi::Boolean::New(env, visible);
}

static Napi::Value setWindowBounds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    Napi::Object b{ info[1].As<Napi::Object> () };

    int32_t x = b.Get("x").ToNumber().Int32Value();;
    int32_t y = b.Get("y").ToNumber().Int32Value();;
    int32_t w = b.Get("width").ToNumber().Int32Value();;
    int32_t h = b.Get("height").ToNumber().Int32Value();;
    uint16_t mask = XCB_CONFIG_WINDOW_X | XCB_CONFIG_WINDOW_Y | XCB_CONFIG_WINDOW_WIDTH | XCB_CONFIG_WINDOW_HEIGHT;
    uint32_t values[4] = {(uint32_t)x, (uint32_t)y, (uint32_t)w, (uint32_t)h};
    xcb_configure_window(connection, win, mask, values);
    xcb_flush(connection);
    return env.Undefined();
}

static Napi::Value showWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    std::string type = info[1].As<Napi::String>();
    if (type == "show" || type == "restore" || type == "maximize") {
        xcb_map_window(connection, win);
        xcb_flush(connection);
        return env.Undefined();
    } else if (type == "hide" || type == "minimize") {
        xcb_unmap_window(connection, win);
        xcb_flush(connection);
        return env.Undefined();
    }
    throw Napi::Error::New(env, "Invalid showWindow action");
}

static Napi::Value setWindowOpacity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    double opacity = info[1].As<Napi::Number>().DoubleValue();
    if (opacity < 0.0) opacity = 0.0;
    if (opacity > 1.0) opacity = 1.0;
    uint32_t value = (uint32_t)(opacity * 4294967295.0);
    xcb_atom_t OPACITY = intern_atom("_NET_WM_WINDOW_OPACITY");
    xcb_change_property(connection, XCB_PROP_MODE_REPLACE, win, OPACITY, XCB_ATOM_CARDINAL, 32, 1, &value);
    xcb_flush(connection);
    return env.Undefined();
}

static Napi::Value toggleWindowTransparency(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Transparency toggling is managed by opacity on Linux; nothing to do, report success
    return env.Undefined();
}

static Napi::Value setWindowOwner(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    xcb_window_t owner = static_cast<xcb_window_t>(info[1].ToNumber().Int64Value());
    xcb_change_property(connection, XCB_PROP_MODE_REPLACE, win, XCB_ATOM_WM_TRANSIENT_FOR, XCB_ATOM_WINDOW, 32, 1, &owner);
    xcb_flush(connection);
    return env.Undefined();
}

static Napi::Value redrawWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!ensure_xcb_initialized()) throw Napi::Error::New(env, "XCB initialization failed");
    xcb_window_t win = static_cast<xcb_window_t>(info[0].ToNumber().Int64Value());
    // Nudge stacking to trigger a refresh without changing position
    uint32_t values[] = {XCB_STACK_MODE_ABOVE};
    xcb_configure_window(connection, win, XCB_CONFIG_WINDOW_STACK_MODE, values);
    xcb_flush(connection);
    return env.Undefined();
}

Napi::Object window_init(Napi::Env env, Napi::Object exports) {
    LOG("Initializing window.cc");
    exports.Set("getWindows", Napi::Function::New(env, getWindows));
    exports.Set("initWindow", Napi::Function::New(env, initWindow));
    exports.Set("bringWindowToTop", Napi::Function::New(env, bringWindowToTop));
    exports.Set("getActiveWindow", Napi::Function::New(env, getActiveWindow));
    exports.Set("getActiveWindowInfo", Napi::Function::New(env, getActiveWindowInfo));
    exports.Set("getWindowBounds", Napi::Function::New(env, getWindowBounds));
    exports.Set("getWindowTitle", Napi::Function::New(env, getWindowTitle));
    exports.Set("getWindowOpacity", Napi::Function::New(env, getWindowOpacity));
    exports.Set("getWindowOwner", Napi::Function::New(env, getWindowOwner));
    exports.Set("isWindow", Napi::Function::New(env, isWindow));
    exports.Set("isWindowVisible", Napi::Function::New(env, isWindowVisible));
    exports.Set("setWindowBounds", Napi::Function::New(env, setWindowBounds));
    exports.Set("showWindow", Napi::Function::New(env, showWindow));
    exports.Set("setWindowOpacity", Napi::Function::New(env, setWindowOpacity));
    exports.Set("toggleWindowTransparency", Napi::Function::New(env, toggleWindowTransparency));
    exports.Set("setWindowOwner", Napi::Function::New(env, setWindowOwner));
    exports.Set("redrawWindow", Napi::Function::New(env, redrawWindow));
    return exports;
}
