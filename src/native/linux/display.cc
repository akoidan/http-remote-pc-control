#include "./headers/display.h"
#include "./headers/logger.h"
#include <iostream>
#include <napi.h>

Display* mainDisplay = NULL;
int registered = 0;
char* displayName = NULL;
int hasDisplayNameChanged = 0;

void XCloseMainDisplay(void) {
  if (mainDisplay != NULL) {
    XCloseDisplay(mainDisplay);
    mainDisplay = NULL;
  }
}

Display* XGetMainDisplay(Napi::Env env) {
  /* Close the display if displayName has changed */
  if (hasDisplayNameChanged) {
    XCloseMainDisplay();
    hasDisplayNameChanged = 0;
  }

  if (mainDisplay == NULL) {
    /* First try the user set displayName */
    mainDisplay = XOpenDisplay(displayName);

    if (mainDisplay == NULL) {
      throw Napi::Error::New(env, "Couldn't open main display");
    }
    if (!registered) {
      atexit(&XCloseMainDisplay);
      registered = 1;
    }
  }

  return mainDisplay;
}
