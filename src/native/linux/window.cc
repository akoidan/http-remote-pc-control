#include <napi.h>
#include <unistd.h>
#include <xcb/xcb_ewmh.h>
#include "./headers/window.h"
#include "./headers/logger.h"
#include "./headers/process.h"
#include "./headers/validators.h"


// Global XCB connection
static xcb_connection_t* connection = nullptr;
static xcb_ewmh_connection_t ewmh;
static xcb_window_t root_window;


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
pid_t getWindowPid(xcb_window_t window, Napi::Env env) {

  xcb_get_property_cookie_t cookie = xcb_get_property(
    connection,
    0,
    window,
    ewmh._NET_WM_PID,
    XCB_ATOM_CARDINAL,
    0,
    1
    );

  xcb_get_property_reply_t* reply = xcb_get_property_reply(connection, cookie, nullptr);
  if (!reply) {
    throw Napi::Error::New(env, "Failed to get reply from XCB connection");
  };

  pid_t pid = 0;
  if (reply->type == XCB_ATOM_CARDINAL && reply->format == 32 && reply->length == 1) {
    pid = *(pid_t*)xcb_get_property_value(reply);
    free(reply);
  } else {
    free(reply);
    throw Napi::Error::New(env, "Failed to get PID from XCB reply");
  }
  return pid;
}

void setWindowActive(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  GET_INT_64(info, 0, window_id, xcb_window_t);

  ensure_xcb_initialized(env);

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

Napi::Number getWindowActiveId(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  ensure_xcb_initialized(env);
  xcb_get_property_cookie_t cookie = xcb_ewmh_get_active_window(&ewmh, 0);
  xcb_window_t active_window = 0;

  if (!xcb_ewmh_get_active_window_reply(&ewmh, cookie, &active_window, nullptr)) {
    throw Napi::Error::New(env, "Failed to get active window");
  }

  return Napi::Number::New(env, static_cast<int64_t>(active_window));
}


std::string getWindowVisiblity(Napi::Env env, xcb_window_t window_id) {
  // Get window visibility state
  std::string visibility = "show"; // default

  // Check if window is mapped (visible)
  xcb_get_window_attributes_cookie_t attr_cookie = xcb_get_window_attributes(connection, window_id);
  xcb_get_window_attributes_reply_t* attr_reply = xcb_get_window_attributes_reply(connection, attr_cookie, nullptr);

  if (attr_reply) {
    if (attr_reply->map_state != XCB_MAP_STATE_VIEWABLE) {
      visibility = "hide";
    }
    free(attr_reply);
  }

  // Check for minimized state
  xcb_get_property_cookie_t state_cookie = xcb_get_property(
    connection, 0, window_id, ewmh._NET_WM_STATE, XCB_ATOM_ATOM, 0, 1024);
  xcb_get_property_reply_t* state_reply = xcb_get_property_reply(connection, state_cookie, nullptr);

  if (!state_reply) {
    throw Napi::Error::New(env, "Failed to get _NET_WM_STATE property reply");
  }

  // If property doesn't exist, it's not minimized or maximized
  if (state_reply->type == XCB_NONE) {
    free(state_reply);
    return visibility; // Return early with default visibility
  } else if (state_reply->type != XCB_ATOM) {
    free(state_reply);
    throw Napi::Error::New(env, "_NET_WM_STATE property type is not ATOM");
  } else if (state_reply->format != 32) {
    free(state_reply);
    throw Napi::Error::New(env, "_NET_WM_STATE property format is not 32");
  } else {
    xcb_atom_t* atoms = (xcb_atom_t*)xcb_get_property_value(state_reply);
    int atom_count = state_reply->value_len;

    bool is_hidden = false;
    bool is_maximized = false;

    for (int i = 0; i < atom_count; i++) {
      if (atoms[i] == ewmh._NET_WM_STATE_HIDDEN) {
        is_hidden = true;
      }
      if (atoms[i] == ewmh._NET_WM_STATE_MAXIMIZED_VERT ||
          atoms[i] == ewmh._NET_WM_STATE_MAXIMIZED_HORZ) {
        is_maximized = true;
          }
    }

    if (is_hidden) {
      visibility = "minimize";
    } else if (is_maximized) {
      visibility = "maximize";
    }

    free(state_reply);
  }
  return visibility;
}


Napi::Object getWindowBounds(Napi::Env env, xcb_window_t window_id) {
  xcb_get_geometry_cookie_t geom_cookie = xcb_get_geometry(connection, window_id);
  xcb_get_geometry_reply_t* geom_reply = xcb_get_geometry_reply(connection, geom_cookie, nullptr);

  if (!geom_reply) {
    throw Napi::Error::New(env, "Failed to get window geometry");
  }

  // Get window's absolute position (accounting for window decorations)
  xcb_translate_coordinates_cookie_t trans_cookie = xcb_translate_coordinates(
    connection, window_id, root_window, 0, 0);
  xcb_translate_coordinates_reply_t* trans_reply =
    xcb_translate_coordinates_reply(connection, trans_cookie, nullptr);

  if (!trans_reply) {
    free(geom_reply);
    throw Napi::Error::New(env, "Failed to translate window coordinates");
  }

  Napi::Object bounds = Napi::Object::New(env);
  bounds.Set("x", Napi::Number::New(env, trans_reply->dst_x));
  bounds.Set("y", Napi::Number::New(env, trans_reply->dst_y));
  bounds.Set("width", Napi::Number::New(env, geom_reply->width));
  bounds.Set("height", Napi::Number::New(env, geom_reply->height));

  free(geom_reply);
  free(trans_reply);

  return bounds;
}

Napi::Object getWindowInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_UINT_32(info, 0, window_id, xcb_window_t);

  ensure_xcb_initialized(env);

  pid_t pid = getWindowPid(window_id, env);
  std::string path = getProcessPath(pid, env);
  Napi::Object bounds = getWindowBounds(env, window_id);
  std::string visibility = getWindowVisiblity(env, window_id);
  Napi::Object result = Napi::Object::New(env);
  result.Set("wid", Napi::Number::New(env, static_cast<int64_t>(window_id)));
  result.Set("pid", Napi::Number::New(env, pid));
  result.Set("path", Napi::String::New(env, path));
  result.Set("bounds", bounds);
  result.Set("visibility", Napi::String::New(env, visibility));

  return result;
}


// Get all window handles for a specified process ID
Napi::Array getWindowsByProcessId(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_UINT_32(info, 0, target_pid, pid_t);
  Napi::Array result = Napi::Array::New(env);

  ensure_xcb_initialized(env);
  xcb_ewmh_get_windows_reply_t clients;
  xcb_get_property_cookie_t cookie = xcb_ewmh_get_client_list(&ewmh, 0);

  if (!xcb_ewmh_get_client_list_reply(&ewmh, cookie, &clients, nullptr)) {
    throw Napi::Error::New(env, "Failed to get client list");
  }

  size_t count = 0;
  for (unsigned int i = 0; i < clients.windows_len; i++) {
    try {
      pid_t window_pid = getWindowPid(clients.windows[i], env);
      if (window_pid == target_pid) {
        result[count++] = Napi::Number::New(env, static_cast<int64_t>(clients.windows[i]));
      }
    }
    catch (const Napi::Error&) {
      // Skip windows that cause errors
      continue;
    }
  }

  xcb_ewmh_get_windows_reply_wipe(&clients);
  return result;
}

void setWindowBounds(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  ensure_xcb_initialized(env);

  GET_INT_64(info, 0, window_id, xcb_window_t);
  GET_OBJECT(info, 1, bounds);
  ASSERT_OBJECT_NUMBER(info, 1, "x");
  ASSERT_OBJECT_NUMBER(info, 1, "y");
  ASSERT_OBJECT_NUMBER(info, 1, "width");
  ASSERT_OBJECT_NUMBER(info, 1, "height");

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



// Show a window
void setWindowState(const Napi::CallbackInfo& info) {
  Napi::Env env{info.Env()};

  ensure_xcb_initialized(env);
  
  GET_INT_64(info, 0, window_id, xcb_window_t);
  GET_STRING(info, 1, type);

  if (type == "show") {
    // Map the window (make it visible)
    xcb_map_window(connection, window_id);
  } else if (type == "hide") {
    // Unmap the window (make it invisible)
    xcb_unmap_window(connection, window_id);
  } else if (type == "minimize") {
    // Send _NET_WM_STATE_HIDDEN message to minimize
    xcb_client_message_event_t event;
    memset(&event, 0, sizeof(event));
    event.response_type = XCB_CLIENT_MESSAGE;
    event.format = 32;
    event.window = window_id;
    event.type = ewmh._NET_WM_STATE;
    event.data.data32[0] = 1; // _NET_WM_STATE_ADD
    event.data.data32[1] = ewmh._NET_WM_STATE_HIDDEN;
    event.data.data32[2] = XCB_NONE;
    event.data.data32[3] = 0;
    
    xcb_send_event(connection, 0, root_window,
                   XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY | XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT,
                   (const char*)&event);
  } else if (type == "restore") {
    // Remove hidden state and map window
    xcb_client_message_event_t event;
    memset(&event, 0, sizeof(event));
    event.response_type = XCB_CLIENT_MESSAGE;
    event.format = 32;
    event.window = window_id;
    event.type = ewmh._NET_WM_STATE;
    event.data.data32[0] = 0; // _NET_WM_STATE_REMOVE
    event.data.data32[1] = ewmh._NET_WM_STATE_HIDDEN;
    event.data.data32[2] = XCB_NONE;
    event.data.data32[3] = 0;
    
    xcb_send_event(connection, 0, root_window,
                   XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY | XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT,
                   (const char*)&event);
    xcb_map_window(connection, window_id);
  } else if (type == "maximize") {
    // Send _NET_WM_STATE_MAXIMIZED_VERT and _NET_WM_STATE_MAXIMIZED_HORZ
    xcb_client_message_event_t event;
    memset(&event, 0, sizeof(event));
    event.response_type = XCB_CLIENT_MESSAGE;
    event.format = 32;
    event.window = window_id;
    event.type = ewmh._NET_WM_STATE;
    event.data.data32[0] = 1; // _NET_WM_STATE_ADD
    event.data.data32[1] = ewmh._NET_WM_STATE_MAXIMIZED_VERT;
    event.data.data32[2] = ewmh._NET_WM_STATE_MAXIMIZED_HORZ;
    event.data.data32[3] = 0;
    
    xcb_send_event(connection, 0, root_window,
                   XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY | XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT,
                   (const char*)&event);
  } else {
    throw Napi::Error::New(env, "Invalid window show type");
  }

  xcb_flush(connection);
}



Napi::Object windowInit(Napi::Env env, Napi::Object exports) {
  exports.Set("getWindowActiveId", Napi::Function::New(env, getWindowActiveId));
  exports.Set("getWindowsByProcessId", Napi::Function::New(env, getWindowsByProcessId));
  exports.Set("getWindowInfo", Napi::Function::New(env, getWindowInfo));
  exports.Set("setWindowActive", Napi::Function::New(env, setWindowActive));
  exports.Set("setWindowState", Napi::Function::New(env, setWindowState));
  exports.Set("setWindowBounds", Napi::Function::New(env, setWindowBounds));
  return exports;
}
