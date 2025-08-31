//
// Created by andrew on 2/2/25.
#include "./headers/display.h"
#include <X11/extensions/XTest.h>
#include "./headers/logger.h"

Display *mainDisplay = NULL;
int registered = 0;
char *displayName = NULL;
int hasDisplayNameChanged = 0;

void XCloseMainDisplay(void) {
    if (mainDisplay != NULL) {
        XCloseDisplay(mainDisplay);
        mainDisplay = NULL;
    }
}

Display *XGetMainDisplay(void) {
    /* Close the display if displayName has changed */
    if (hasDisplayNameChanged) {
        XCloseMainDisplay();
        hasDisplayNameChanged = 0;
    }

    if (mainDisplay == NULL) {
        /* First try the user set displayName */
        mainDisplay = XOpenDisplay(displayName);

        if (mainDisplay == NULL) {
            LOG("Could not open main display");
        } else if (!registered) {
            atexit(&XCloseMainDisplay);
            registered = 1;
        }
    }

    return mainDisplay;
}
