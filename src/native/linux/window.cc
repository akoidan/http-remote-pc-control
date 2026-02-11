#include <napi.h>
#include <unistd.h>
#include <xcb/xcb_ewmh.h>
#include "./headers/window.h"
#include "./headers/logger.h"
#include "./headers/process.h"
#include "./headers/validators.h"
#include <X11/Xlib.h>
#include <X11/Xatom.h>

#include "headers/display.h"

// Global XCB connection
static xcb_connection_t* connection = nullptr;
static xcb_ewmh_connection_t ewmh;
static xcb_window_t rootWindow;
static xcb_atom_t netWmWindowOpacityAtom;


// Initialize XCB if not already initialized
void ensure_xcb_initialized(Napi::Env env) {
  if (connection) {
    return;
  }
  int screenNum;
  connection = xcb_connect(nullptr, &screenNum);

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
  rootWindow = screen->root;

  xcb_generic_error_t* ewmh_error = nullptr;
  if (xcb_ewmh_init_atoms_replies(&ewmh, xcb_ewmh_init_atoms(connection, &ewmh), &ewmh_error) == 0) {
    std::string errorMsg = "Failed to initialize EWMH atoms";
    if (ewmh_error) {
      errorMsg += ": X11 error code " + std::to_string(ewmh_error->error_code);
      errorMsg += " (sequence: " + std::to_string(ewmh_error->sequence) + ")";
      free(ewmh_error);
    }
    xcb_disconnect(connection);
    connection = nullptr;
    throw Napi::Error::New(env, errorMsg);
  }

  // Initialize _NET_WM_WINDOW_OPACITY atom
  xcb_intern_atom_cookie_t opacityCookie = xcb_intern_atom(connection, 0, strlen("_NET_WM_WINDOW_OPACITY"), "_NET_WM_WINDOW_OPACITY");
  xcb_generic_error_t* opacityError = nullptr;
  xcb_intern_atom_reply_t* opacityReply = xcb_intern_atom_reply(connection, opacityCookie, &opacityError);
  if (!opacityReply) {
    std::string errorMsg = "Failed to get _NET_WM_WINDOW_OPACITY atom reply";
    if (opacityError) {
      errorMsg += ": X11 error code " + std::to_string(opacityError->error_code);
      errorMsg += " (sequence: " + std::to_string(opacityError->sequence) + ")";
      free(opacityError);
    }
    netWmWindowOpacityAtom = XCB_NONE;
  } else {
    netWmWindowOpacityAtom = opacityReply->atom;
    free(opacityReply);
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

  xcb_generic_error_t* error = nullptr;
  xcb_get_property_reply_t* reply = xcb_get_property_reply(connection, cookie, &error);
  if (!reply) {
    std::string errorMsg = "Failed to get _NET_WM_PID property reply";
    if (error) {
      errorMsg += ": X11 error code " + std::to_string(error->error_code);
      errorMsg += " (sequence: " + std::to_string(error->sequence) + ")";
      free(error);
    }
    throw Napi::Error::New(env, errorMsg);
  };

  pid_t pid = 0;
  if (reply->type == XCB_ATOM_CARDINAL && reply->format == 32 && reply->length == 1) {
    pid = *(pid_t*)xcb_get_property_value(reply);
    free(reply);
  } else {
    free(reply);
    return 0; // TODO this is an error :(
    // throw Napi::Error::New(env, "Failed to get PID from XCB reply");
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

  xcb_send_event(connection, 0, rootWindow,
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
  xcb_window_t activeWindow = 0;

  xcb_generic_error_t* error = nullptr;
  if (!xcb_ewmh_get_active_window_reply(&ewmh, cookie, &activeWindow, &error)) {
    std::string errorMsg = "Failed to get active window";

    if (error) {
      switch (error->error_code) {
      case XCB_WINDOW:  // 3
        errorMsg += ": Invalid window";
        break;
      case XCB_VALUE:   // 2
        errorMsg += ": Invalid value";
        break;
      case XCB_ACCESS:  // 10
        errorMsg += ": Access denied";
        break;
      default:
        errorMsg += ": X11 error code " + std::to_string(error->error_code);
      }
      errorMsg += " (sequence: " + std::to_string(error->sequence) + ")";
      free(error);
    } else {
      errorMsg += ": No EWMH support or window manager not compliant";
    }

    throw Napi::Error::New(env, errorMsg);
  }

  return Napi::Number::New(env, static_cast<int64_t>(activeWindow));
}


std::string getWindowVisiblity(Napi::Env env, xcb_window_t window_id) {
  // Get window visibility state
  std::string visibility = "show"; // default

  // Check if window is mapped (visible)
  xcb_get_window_attributes_cookie_t attrCookie = xcb_get_window_attributes(connection, window_id);
  xcb_generic_error_t* attrError = nullptr;
  xcb_get_window_attributes_reply_t* attrReply = xcb_get_window_attributes_reply(connection, attrCookie, &attrError);

  if (attrReply) {
    if (attrReply->map_state != XCB_MAP_STATE_VIEWABLE) {
      visibility = "hide";
    }
    free(attrReply);
  } else {
    std::string errorMsg = "Failed to get window attributes";
    if (attrError) {
      errorMsg += ": X11 error code " + std::to_string(attrError->error_code);
      errorMsg += " (sequence: " + std::to_string(attrError->sequence) + ")";
      free(attrError);
    }
    throw Napi::Error::New(env, errorMsg);
  }

  // Check for minimized state
  xcb_get_property_cookie_t stateCookie = xcb_get_property(
    connection, 0, window_id, ewmh._NET_WM_STATE, XCB_ATOM_ATOM, 0, 1024);
  xcb_generic_error_t* stateError = nullptr;
  xcb_get_property_reply_t* stateReply = xcb_get_property_reply(connection, stateCookie, &stateError);

  if (!stateReply) {
    std::string errorMsg = "Failed to get _NET_WM_STATE property reply";
    if (stateError) {
      errorMsg += ": X11 error code " + std::to_string(stateError->error_code);
      errorMsg += " (sequence: " + std::to_string(stateError->sequence) + ")";
      free(stateError);
    }
    throw Napi::Error::New(env, errorMsg);
  }

  // If property doesn't exist, it's not minimized or maximized
  if (stateReply->type == XCB_NONE) {
    free(stateReply);
    return visibility; // Return early with default visibility
  } else if (stateReply->type != XCB_ATOM && stateReply->type != 4) { // 4 is XA_ATOM
    free(stateReply);
    throw Napi::Error::New(env, "_NET_WM_STATE property type is not ATOM");
  } else if (stateReply->format != 32) {
    free(stateReply);
    throw Napi::Error::New(env, "_NET_WM_STATE property format is not 32");
  } else {
    xcb_atom_t* atoms = (xcb_atom_t*)xcb_get_property_value(stateReply);
    int atomCount = stateReply->value_len;

    bool isHidden = false;
    bool isMaximized = false;

    for (int i = 0; i < atomCount; i++) {
      if (atoms[i] == ewmh._NET_WM_STATE_HIDDEN) {
        isHidden = true;
      }
      if (atoms[i] == ewmh._NET_WM_STATE_MAXIMIZED_VERT ||
          atoms[i] == ewmh._NET_WM_STATE_MAXIMIZED_HORZ) {
        isMaximized = true;
          }
    }

    if (isHidden) {
      visibility = "minimize";
    } else if (isMaximized) {
      visibility = "maximize";
    }

    free(stateReply);
  }
  return visibility;
}


Napi::Object getWindowBounds(Napi::Env env, xcb_window_t window_id) {
  xcb_get_geometry_cookie_t geomCookie = xcb_get_geometry(connection, window_id);
  xcb_generic_error_t* geomError = nullptr;
  xcb_get_geometry_reply_t* geomReply = xcb_get_geometry_reply(connection, geomCookie, &geomError);

  if (!geomReply) {
    std::string errorMsg = "Failed to get window geometry";
    if (geomError) {
      errorMsg += ": X11 error code " + std::to_string(geomError->error_code);
      errorMsg += " (sequence: " + std::to_string(geomError->sequence) + ")";
      free(geomError);
    }
    throw Napi::Error::New(env, errorMsg);
  }

  // Get window's absolute position (accounting for window decorations)
  xcb_translate_coordinates_cookie_t transCookie = xcb_translate_coordinates(
    connection, window_id, rootWindow, 0, 0);
  xcb_generic_error_t* transError = nullptr;
  xcb_translate_coordinates_reply_t* transReply =
    xcb_translate_coordinates_reply(connection, transCookie, &transError);

  if (!transReply) {
    std::string errorMsg = "Failed to translate window coordinates";
    if (transError) {
      errorMsg += ": X11 error code " + std::to_string(transError->error_code);
      errorMsg += " (sequence: " + std::to_string(transError->sequence) + ")";
      free(transError);
    }
    free(geomReply);
    throw Napi::Error::New(env, errorMsg);
  }

  Napi::Object bounds = Napi::Object::New(env);
  bounds.Set("x", Napi::Number::New(env, transReply->dst_x));
  bounds.Set("y", Napi::Number::New(env, transReply->dst_y));
  bounds.Set("width", Napi::Number::New(env, geomReply->width));
  bounds.Set("height", Napi::Number::New(env, geomReply->height));

  free(geomReply);
  free(transReply);

  return bounds;
}

std::string getWindowTitle(Napi::Env env, xcb_window_t window_id) {
  xcb_get_property_cookie_t cookie = xcb_get_property(
    connection, 0, window_id, ewmh._NET_WM_NAME, XCB_ATOM_STRING, 0, 1024);
  xcb_generic_error_t* error = nullptr;
  xcb_get_property_reply_t* reply = xcb_get_property_reply(connection, cookie, &error);
  
  std::string title = "";
  if (reply && reply->type != XCB_NONE && reply->format == 8 && reply->length > 0) {
    title = std::string((char*)xcb_get_property_value(reply), reply->length);
  }
  
  if (reply) free(reply);
  
  // Fallback to WM_NAME if _NET_WM_NAME is not available
  if (title.empty()) {
    cookie = xcb_get_property(connection, 0, window_id, XCB_ATOM_WM_NAME, XCB_ATOM_STRING, 0, 1024);
    xcb_generic_error_t* fallback_error = nullptr;
    reply = xcb_get_property_reply(connection, cookie, &fallback_error);
    
    if (!reply) {
      std::string errorMsg = "Failed to get WM_NAME property reply";
      if (fallback_error) {
        errorMsg += ": X11 error code " + std::to_string(fallback_error->error_code);
        errorMsg += " (sequence: " + std::to_string(fallback_error->sequence) + ")";
        free(fallback_error);
      }
      // Don't throw here, just return empty title since it's a fallback
    } else if (reply->type != XCB_NONE && reply->format == 8 && reply->length > 0) {
      title = std::string((char*)xcb_get_property_value(reply), reply->length);
    }
    
    if (reply) free(reply);
  } else if (error) {
    // Free error from first attempt if we got a reply
    free(error);
  }
  
  return title;
}

double getWindowOpacity(Napi::Env env, xcb_window_t window_id) {
  if (netWmWindowOpacityAtom == XCB_NONE) {
    return 1.0; // Opacity not supported
  }
  
  xcb_get_property_cookie_t cookie = xcb_get_property(
    connection, 0, window_id, netWmWindowOpacityAtom, XCB_ATOM_CARDINAL, 0, 1);
  xcb_generic_error_t* error = nullptr;
  xcb_get_property_reply_t* reply = xcb_get_property_reply(connection, cookie, &error);
  
  double opacity = 1.0; // Default opacity
  if (reply && reply->type == XCB_ATOM_CARDINAL && reply->format == 32 && reply->length == 1) {
    uint32_t opacityValue = *(uint32_t*)xcb_get_property_value(reply);
    opacity = static_cast<double>(opacityValue) / 4294967295.0;
  } else if (!reply) {
    std::string errorMsg = "Failed to get _NET_WM_WINDOW_OPACITY property reply";
    if (error) {
      errorMsg += ": X11 error code " + std::to_string(error->error_code);
      errorMsg += " (sequence: " + std::to_string(error->sequence) + ")";
      free(error);
    }
    // Don't throw here, just return default opacity since it's not critical
  }
  
  if (reply) free(reply);
  return opacity;
}

xcb_window_t getParentWindow(Napi::Env env, xcb_window_t window_id) {
  xcb_query_tree_cookie_t cookie = xcb_query_tree(connection, window_id);
  xcb_generic_error_t* error = nullptr;
  xcb_query_tree_reply_t* reply = xcb_query_tree_reply(connection, cookie, &error);
  
  xcb_window_t parent = 0;
  if (reply) {
    parent = reply->parent;
    free(reply);
  } else {
    std::string errorMsg = "Failed to get window tree";
    if (error) {
      errorMsg += ": X11 error code " + std::to_string(error->error_code);
      errorMsg += " (sequence: " + std::to_string(error->sequence) + ")";
      free(error);
    }
    throw Napi::Error::New(env, errorMsg);
  }
  
  return parent;
}

Napi::Object getWindowInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_UINT_32(info, 0, window_id, xcb_window_t);

  ensure_xcb_initialized(env);

  pid_t pid = getWindowPid(window_id, env);
  Napi::Object result = Napi::Object::New(env);
  if (pid != 0) {
    std::string path = getProcessPath(pid, env);
    result.Set("path", Napi::String::New(env, path));
    result.Set("pid", Napi::Number::New(env, pid));
  }

  Napi::Object bounds = getWindowBounds(env, window_id);
  std::string visibility = getWindowVisiblity(env, window_id);
  std::string title = getWindowTitle(env, window_id);
  double opacity = getWindowOpacity(env, window_id);
  xcb_window_t parentWid = getParentWindow(env, window_id);
  

  result.Set("wid", Napi::Number::New(env, static_cast<int64_t>(window_id)));
  result.Set("bounds", bounds);
  result.Set("visibility", Napi::String::New(env, visibility));
  result.Set("title", Napi::String::New(env, title));
  result.Set("opacity", Napi::Number::New(env, opacity));
  result.Set("parentWid", Napi::Number::New(env, static_cast<int64_t>(parentWid)));

  return result;
}


// Get all window handles for a specified process ID
Napi::Array getWindowsByProcessId(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  GET_UINT_32(info, 0, targetPid, pid_t);
  Napi::Array result = Napi::Array::New(env);

  ensure_xcb_initialized(env);
  xcb_ewmh_get_windows_reply_t clients;
  xcb_get_property_cookie_t cookie = xcb_ewmh_get_client_list(&ewmh, 0);

  xcb_generic_error_t* error = nullptr;
  if (!xcb_ewmh_get_client_list_reply(&ewmh, cookie, &clients, &error)) {
    std::string errorMsg = "Failed to get client list";

    if (error) {
      switch (error->error_code) {
      case XCB_WINDOW:  // 3
        errorMsg += ": Invalid window";
        break;
      case XCB_VALUE:   // 2
        errorMsg += ": Invalid value";
        break;
      case XCB_ACCESS:  // 10
        errorMsg += ": Access denied";
        break;
      default:
        errorMsg += ": X11 error code " + std::to_string(error->error_code);
      }
      errorMsg += " (sequence: " + std::to_string(error->sequence) + ")";
      free(error);
    } else {
      errorMsg += ": No EWMH support or window manager not compliant";
    }

    throw Napi::Error::New(env, errorMsg);
  }

  size_t count = 0;
  for (unsigned int i = 0; i < clients.windows_len; i++) {
    try {
      pid_t windowPid = getWindowPid(clients.windows[i], env);
      if (windowPid == targetPid) {
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
  ASSERT_OBJECT_NUMBER(info, 1, x);
  ASSERT_OBJECT_NUMBER(info, 1, y);
  ASSERT_OBJECT_NUMBER(info, 1, width);
  ASSERT_OBJECT_NUMBER(info, 1, height);

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
    
    xcb_send_event(connection, 0, rootWindow,
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
    
    xcb_send_event(connection, 0, rootWindow,
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
    
    xcb_send_event(connection, 0, rootWindow,
                   XCB_EVENT_MASK_SUBSTRUCTURE_NOTIFY | XCB_EVENT_MASK_SUBSTRUCTURE_REDIRECT,
                   (const char*)&event);
  } else {
    throw Napi::Error::New(env, "Invalid window show type");
  }

  xcb_flush(connection);
}

void setWindowOpacity(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  ensure_xcb_initialized(env);
  
  GET_INT_64(info, 0, window_id, xcb_window_t);
  GET_DOUBLE(info, 1, opacity);
  
  if (opacity < 0.0 || opacity > 1.0) {
    throw Napi::Error::New(env, "Opacity must be between 0.0 and 1.0");
  }
  
  if (netWmWindowOpacityAtom == XCB_NONE) {
    throw Napi::Error::New(env, "Window opacity not supported");
  }
  
  // Convert opacity to 32-bit integer (0-4294967295)
  uint32_t opacityValue = static_cast<uint32_t>(opacity * 4294967295.0);
  
  xcb_change_property(connection, XCB_PROP_MODE_REPLACE, window_id,
                       netWmWindowOpacityAtom, XCB_ATOM_CARDINAL, 32, 1, &opacityValue);
  xcb_flush(connection);
}
; // Global variable
// Add to your native module
Napi::Value createTestWindow(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Display* test_display = xGetMainDisplay(env);

  Window window = XCreateSimpleWindow(test_display,
                                  RootWindow(test_display, DefaultScreen(test_display)),
                                  100, 100, 500, 500, 1,
                                  BlackPixel(test_display, DefaultScreen(test_display)),
                                  WhitePixel(test_display, DefaultScreen(test_display)));

  XMapWindow(test_display, window);
  XFlush(test_display);

  return Napi::Number::New(env, (int64_t)window);
}

Napi::Object windowInit(Napi::Env env, Napi::Object exports) {
  exports.Set("setWindowActive", Napi::Function::New(env, setWindowActive));
  exports.Set("getWindowActiveId", Napi::Function::New(env, getWindowActiveId));
  exports.Set("getWindowsByProcessId", Napi::Function::New(env, getWindowsByProcessId));
  exports.Set("setWindowState", Napi::Function::New(env, setWindowState));
  exports.Set("getWindowInfo", Napi::Function::New(env, getWindowInfo));
  exports.Set("setWindowBounds", Napi::Function::New(env, setWindowBounds));

  exports.Set("setWindowOpacity", Napi::Function::New(env, setWindowOpacity));
  exports.Set("createTestWindow", Napi::Function::New(env, createTestWindow));
  return exports;
}

// pid_t getWindowPid(xcb_window_t window, Napi::Env env) {
//   Display* display = XOpenDisplay(NULL);
//   if (!display) {
//     throw Napi::Error::New(env, "Failed to open X display");
//   }
//
//   Atom pid_atom = XInternAtom(display, "_NET_WM_PID", False);
//   Atom actual_type;
//   int actual_format;
//   unsigned long nitems, bytes_after;
//   unsigned char *prop = NULL;
//
//   pid_t pid = 0;
//   Status result = XGetWindowProperty(display, window, pid_atom, 0, 1, False,
//                                XA_CARDINAL, &actual_type, &actual_format,
//                                &nitems, &bytes_after, &prop);
//
//   XCloseDisplay(display);
//
//   if (result != Success) {
//     throw Napi::Error::New(env, "Failed to get window property");
//   }
//
//   if (!prop || nitems == 0) {
//     if (prop) XFree(prop);
//     throw Napi::Error::New(env, "No PID property found on window");
//   }
//
//   if (actual_type != XA_CARDINAL || actual_format != 32) {
//     XFree(prop);
//     throw Napi::Error::New(env, "PID property has wrong format");
//   }
//
//   pid = *(unsigned long*)prop;
//   XFree(prop);
//
//   if (pid <= 0) {
//     throw Napi::Error::New(env, "Invalid PID value retrieved");
//   }
//
//   return pid;
// }