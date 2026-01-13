#include "./headers/keyboard-layout.h"

#include <napi.h>
#include <dbus/dbus.h>
#include <X11/Xlib.h>
#include <X11/XKBlib.h>
#include <vector>
#include <string>

extern Display* XGetMainDisplay();

std::vector<KdeLayout> getKdeAvailableLayouts() {
    std::vector<KdeLayout> layouts;
    DBusError error;
    DBusConnection* connection;
    DBusMessage* message;
    DBusMessage* reply;
    
    dbus_error_init(&error);
    
    connection = dbus_bus_get(DBUS_BUS_SESSION, &error);
    if (dbus_error_is_set(&error) || !connection) {
        if (dbus_error_is_set(&error)) dbus_error_free(&error);
        return layouts;
    }
    
    // Get list of available layouts
    message = dbus_message_new_method_call(
        "org.kde.keyboard",
        "/Layouts", 
        "org.kde.KeyboardLayouts",
        "getLayoutsList"
    );
    
    if (!message) {
        dbus_connection_unref(connection);
        return layouts;
    }
    
    reply = dbus_connection_send_with_reply_and_block(connection, message, 1000, &error);
    dbus_message_unref(message);
    
    if (!dbus_error_is_set(&error) && reply) {
        DBusMessageIter iter, array_iter, struct_iter;
        dbus_message_iter_init(reply, &iter);
        
        if (dbus_message_iter_get_arg_type(&iter) == DBUS_TYPE_ARRAY) {
            dbus_message_iter_recurse(&iter, &array_iter);
            
            while (dbus_message_iter_get_arg_type(&array_iter) == DBUS_TYPE_STRUCT) {
                dbus_message_iter_recurse(&array_iter, &struct_iter);
                
                KdeLayout layout;
                const char* str;
                
                // First string: layout code
                if (dbus_message_iter_get_arg_type(&struct_iter) == DBUS_TYPE_STRING) {
                    dbus_message_iter_get_basic(&struct_iter, &str);
                    layout.code = std::string(str);
                    dbus_message_iter_next(&struct_iter);
                }
                
                // Second string: variant
                if (dbus_message_iter_get_arg_type(&struct_iter) == DBUS_TYPE_STRING) {
                    dbus_message_iter_get_basic(&struct_iter, &str);
                    layout.variant = std::string(str);
                    dbus_message_iter_next(&struct_iter);
                }
                
                // Third string: display name
                if (dbus_message_iter_get_arg_type(&struct_iter) == DBUS_TYPE_STRING) {
                    dbus_message_iter_get_basic(&struct_iter, &str);
                    layout.displayName = std::string(str);
                }
                
                layouts.push_back(layout);
                dbus_message_iter_next(&array_iter);
            }
        }
        dbus_message_unref(reply);
    }
    
    if (dbus_error_is_set(&error)) {
        dbus_error_free(&error);
    }
    
    dbus_connection_unref(connection);
    return layouts;
}

bool switchToKdeLayout(uint32_t layoutIndex) {
    DBusError error;
    DBusConnection* connection;
    DBusMessage* message;
    DBusMessage* reply;
    
    dbus_error_init(&error);
    
    connection = dbus_bus_get(DBUS_BUS_SESSION, &error);
    if (dbus_error_is_set(&error) || !connection) {
        if (dbus_error_is_set(&error)) dbus_error_free(&error);
        return false;
    }
    
    // Switch to specific layout by index
    message = dbus_message_new_method_call(
        "org.kde.keyboard",
        "/Layouts",
        "org.kde.KeyboardLayouts", 
        "setLayout"
    );
    
    if (!message) {
        dbus_connection_unref(connection);
        return false;
    }
    
    // Add layout index as parameter (uint32)
    dbus_message_append_args(message, DBUS_TYPE_UINT32, &layoutIndex, DBUS_TYPE_INVALID);
    
    reply = dbus_connection_send_with_reply_and_block(connection, message, 1000, &error);
    dbus_message_unref(message);
    
    bool success = false;
    if (!dbus_error_is_set(&error) && reply) {
        success = true;
        dbus_message_unref(reply);
    }
    
    if (dbus_error_is_set(&error)) {
        dbus_error_free(&error);
    }
    
    dbus_connection_unref(connection);
    return success;
}

bool fallbackLayoutSwitch() {
    Display* display = XGetMainDisplay();
    if (!display) {
        return false;
    }
    
    // Get current XKB state
    XkbStateRec state;
    if (XkbGetState(display, XkbUseCoreKbd, &state) != Success) {
        return false;
    }
    
    // Get number of available groups
    XkbDescPtr xkb = XkbAllocKeyboard();
    if (!xkb || XkbGetControls(display, XkbAllControlsMask, xkb) != Success) {
        if (xkb) XkbFreeKeyboard(xkb, 0, True);
        return false;
    }
    
    int numGroups = xkb->ctrls->num_groups;
    XkbFreeKeyboard(xkb, 0, True);
    
    if (numGroups <= 1) {
        return false; // Can't switch if only one group
    }
    
    // Simple cycling to next group
    int targetGroup = (state.group + 1) % numGroups;
    
    bool success = XkbLockGroup(display, XkbUseCoreKbd, targetGroup);
    if (success) {
        XFlush(display);
    }
    
    return success;
}

Napi::Value _setKeyboardLayout(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        throw Napi::Error::New(env, "String expected (layout ID)");
    }

    std::string layoutId = info[0].As<Napi::String>();
    
    // Try KDE's DBus interface first - query available layouts and validate
    std::vector<KdeLayout> availableLayouts = getKdeAvailableLayouts();
    
    if (!availableLayouts.empty()) {
        // Check if requested layout is available and get its index
        int layoutIndex = -1;
        for (size_t i = 0; i < availableLayouts.size(); ++i) {
            if (availableLayouts[i].code == layoutId) {
                layoutIndex = i;
                break;
            }
        }
        
        if (layoutIndex == -1) {
            // Build error message with available layouts
            std::string availableList;
            for (size_t i = 0; i < availableLayouts.size(); ++i) {
                availableList += availableLayouts[i].code + " (" + availableLayouts[i].displayName + ")";
                if (i < availableLayouts.size() - 1) availableList += ", ";
            }
            
            throw Napi::Error::New(env, "Layout '" + layoutId + "' not found. Available layouts: " + availableList);
        }
        
        // Layout is available, try to switch to it by index
        if (switchToKdeLayout(layoutIndex)) {
            return env.Undefined();
        }
        
        throw Napi::Error::New(env, "Failed to switch to layout '" + layoutId + "' via KDE DBus");
    }
    
    // Fallback to direct XKB group switching (works on non-KDE systems or when DBus is unavailable)
    if (fallbackLayoutSwitch()) {
        return env.Undefined();
    }
    
    // If both methods fail, throw error
    throw Napi::Error::New(env, "Failed to switch keyboard layout. KDE service not available and XKB fallback failed.");
}
