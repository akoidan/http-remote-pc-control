#include "./headers/keyboard-layout.h"

#include <napi.h>
#include <dbus/dbus.h>
#include <X11/Xlib.h>
#include <X11/XKBlib.h>
#include <vector>
#include <string>

extern Display* xGetMainDisplay();

std::vector<KdeLayout> getKdeAvailableLayouts() {
  std::vector<KdeLayout> layouts;
  DBusError dbusError;
  DBusConnection* dbusConnection;
  DBusMessage* dbusMessage;
  DBusMessage* dbusReply;

  dbus_error_init(&dbusError);

  dbusConnection = dbus_bus_get(DBUS_BUS_SESSION, &dbusError);
  if (dbus_error_is_set(&dbusError) || !dbusConnection) {
    if (dbus_error_is_set(&dbusError)) dbus_error_free(&dbusError);
    return layouts;
  }

  // Get list of available layouts
  dbusMessage = dbus_message_new_method_call(
    "org.kde.keyboard",
    "/Layouts",
    "org.kde.KeyboardLayouts",
    "getLayoutsList"
  );

  if (!dbusMessage) {
    dbus_connection_unref(dbusConnection);
    return layouts;
  }

  dbusReply = dbus_connection_send_with_reply_and_block(dbusConnection, dbusMessage, 1000, &dbusError);
  dbus_message_unref(dbusMessage);

  if (!dbus_error_is_set(&dbusError) && dbusReply) {
    DBusMessageIter msgIter, arrayIter, structIter;
    dbus_message_iter_init(dbusReply, &msgIter);

    if (dbus_message_iter_get_arg_type(&msgIter) == DBUS_TYPE_ARRAY) {
      dbus_message_iter_recurse(&msgIter, &arrayIter);

      while (dbus_message_iter_get_arg_type(&arrayIter) == DBUS_TYPE_STRUCT) {
        dbus_message_iter_recurse(&arrayIter, &structIter);

        KdeLayout layout;
        const char* strValue;

        // First string: layout code
        if (dbus_message_iter_get_arg_type(&structIter) == DBUS_TYPE_STRING) {
          dbus_message_iter_get_basic(&structIter, &strValue);
          layout.code = std::string(strValue);
          dbus_message_iter_next(&structIter);
        }

        // Second string: variant
        if (dbus_message_iter_get_arg_type(&structIter) == DBUS_TYPE_STRING) {
          dbus_message_iter_get_basic(&structIter, &strValue);
          layout.variant = std::string(strValue);
          dbus_message_iter_next(&structIter);
        }

        // Third string: display name
        if (dbus_message_iter_get_arg_type(&structIter) == DBUS_TYPE_STRING) {
          dbus_message_iter_get_basic(&structIter, &strValue);
          layout.displayName = std::string(strValue);
        }

        layouts.push_back(layout);
        dbus_message_iter_next(&arrayIter);
      }
    }
    dbus_message_unref(dbusReply);
  }

  if (dbus_error_is_set(&dbusError)) {
    dbus_error_free(&dbusError);
  }

  dbus_connection_unref(dbusConnection);
  return layouts;
}

bool switchToKdeLayout(uint32_t layoutIndex) {
  DBusError dbusError;
  DBusConnection* dbusConnection;
  DBusMessage* dbusMessage;
  DBusMessage* dbusReply;

  dbus_error_init(&dbusError);

  dbusConnection = dbus_bus_get(DBUS_BUS_SESSION, &dbusError);
  if (dbus_error_is_set(&dbusError) || !dbusConnection) {
    if (dbus_error_is_set(&dbusError)) dbus_error_free(&dbusError);
    return false;
  }

  // Switch to specific layout by index
  dbusMessage = dbus_message_new_method_call(
    "org.kde.keyboard",
    "/Layouts",
    "org.kde.KeyboardLayouts",
    "setLayout"
  );

  if (!dbusMessage) {
    dbus_connection_unref(dbusConnection);
    return false;
  }

  // Add layout index as parameter (uint32)
  dbus_message_append_args(dbusMessage, DBUS_TYPE_UINT32, &layoutIndex, DBUS_TYPE_INVALID);

  dbusReply = dbus_connection_send_with_reply_and_block(dbusConnection, dbusMessage, 1000, &dbusError);
  dbus_message_unref(dbusMessage);

  bool success = false;
  if (!dbus_error_is_set(&dbusError) && dbusReply) {
    success = true;
    dbus_message_unref(dbusReply);
  }

  if (dbus_error_is_set(&dbusError)) {
    dbus_error_free(&dbusError);
  }

  dbus_connection_unref(dbusConnection);
  return success;
}

bool fallbackLayoutSwitch() {
  Display* display = xGetMainDisplay();
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