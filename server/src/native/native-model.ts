
interface HotkeyNativeModule {
  /**
   * Registers a global hotkey
   * @param modifiers - Modifier keys (e.g. MOD_ALT = 1, MOD_CONTROL = 2, MOD_SHIFT = 4, MOD_WIN = 8)
   * @param key - Virtual key code
   * @param callback - Function to call when hotkey is pressed
   * @returns Hotkey ID that can be used to unregister the hotkey
   */
  registerHotkey(modifiers: number, key: number, callback: () => void): number;

  /**
   * Unregisters a previously registered hotkey
   * @param hotkeyId - ID returned from registerHotkey
   */
  unregisterHotkey(hotkeyId: number): void;

  /**
   * Cleans up all registered hotkeys
   */
  cleanupHotkeys(): void;
}

interface INativeModule extends  HotkeyNativeModule {
}

export const Native = 'Native';

export type {
  INativeModule,
};
