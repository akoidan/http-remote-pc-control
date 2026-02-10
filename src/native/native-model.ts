/* eslint-disable max-lines */
interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}


interface MousePosition {
 x: number;
 y: number;
}

interface ProcessMemory {
  workingSetSize: number;
  peakWorkingSetSize: number;
  privateUsage: number;
  pagefileUsage: number;
}
interface ProcessCpuTimes {
  creationTime: number;
  kernelTime: number;
  userTime: number;
}

interface ProcessInfo {
  processId: number;
  parentId?: number;
  threadCount?: number;
  exePath: string;
  isElevated: boolean;
  memory: ProcessMemory;
  times: ProcessCpuTimes;
}

interface WindowInfo {
  wid: number;
  pid: number;
  path: string;
  bounds: WindowBounds;
  opacity: number;
  title: string;
  parentWid: number;
}

interface MonitorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MonitorInfo {
  bounds: MonitorBounds;
  workArea: MonitorBounds;
  scale: number;
  isPrimary: boolean;
}

enum WindowAction {
  SHOW = 'show',
  HIDE = 'hide',
  MINIMIZE = 'minimize',
  RESTORE = 'restore',
  MAXIMIZE = 'maximize',
}

enum MouseButton {
  LEFT = 1,
  RIGHT = 2,
  MIDDLE = 3,
}

interface WindowNativeModule {
  /**
   * Brings window to foreground
   */
  setWindowActive(handle: number): boolean;
  /**
   * Gets id that's in foreground on top of every other window
   */
  getWindowActiveId(): number;
  /**
   * Returns list of windows ID that this process has
   */
  getWindowsByProcessId(pid: number): number[];
  /**
   * minimizes/maximizes/shows/hides window
   */
  setWindowState(handle: number, visibility: WindowAction): void;
  /**
   * Gets all available information for this window (its process id, title, etc)
   */
  getWindowInfo(handle: number): WindowInfo;
  /**
   * Moves and resizes windows to specified value
   */
  setWindowBounds(handle: number, bounds: WindowBounds): void;
  /**
   * Sets opacity of window, opacity 0..1
   * Requires setWindowIsTransparent first to true
   */
  setWindowOpacity(handle: number, opacity: number): void;
  /**
   * Attaches to window, sharing common keyboard. Only is available on Windows OS
   */
  setWindowAttached(handle: number): void;
}

interface MonitorNativeModule {
  /**
   * Returns all monitors id (actually connected displays)
   */
  getMonitors(): number[];
  /**
   * Gets monitor Id from a window Id
   */
  getMonitorFromWindow(handle: number): number;

  /**
   * Returns minimal information about monitor by its id
   */
  getMonitorInfo(monitor: number): MonitorInfo;
}

interface ProcessNativeModule {
  /**
   * Launches a new process with specified arguments
   */
  createProcess(path: string, cmd?: string): number;

  /**
   * Checks if http-remote-pc-control has Admin privileges (which also sometimes can't be enought for every operation
   * Sometimes this process is required to run from AdminPowerShell and admin CMD would return true despite it doesn't have all
   */
  isProcessElevated(): boolean;


  /**
   * Gets detailed information about a process
   */
  getProcessInfo(pid: number): ProcessInfo;
}

interface KeyboardNativeModule {
  /**
   * Check whether keyboard layout is properly set and capslock is disabled
   * and types text as fast as possible
   */
  typeString(text: string): void;
  /**
   * makes a keypress event, where modifiers are keys to be hold
   */
  keyTap(key: string, modifiers: string[]): void;
  /**
   * Puts key to down or up state, holding modifiers
   */
  keyToggle(key: string, modifiers: string[], down: boolean): void;
  /**
   * Switches keyboard layout to specified one. Note that there are limited set of supported layouts
   */
  setKeyboardLayout(layout: string): void;
}

interface MouseNativeModule {
  /**
   * Clicks on unlicks mouse specific button (puts it in down or up state)
   */
  setMouseButtonToState(button: MouseButton, isDown: boolean): void;

  /**
   * Instantly moves mouse to certain position
   */
  setMousePosition(pos: MousePosition): void;

  /**
   * Returns X,Y coordinates of the mouse
   */
  getMousePosition(): MousePosition;
}

interface INativeModule extends
  WindowNativeModule,
  MonitorNativeModule, 
  ProcessNativeModule, 
  KeyboardNativeModule, 
  MouseNativeModule 
{
  // Path to the native module
  path: string;
}

const Native = 'Native';

export type {
  INativeModule,
  MonitorBounds,
  WindowBounds,
  MonitorInfo,
  WindowNativeModule,
  MonitorNativeModule,
  ProcessNativeModule,
  KeyboardNativeModule,
  MouseNativeModule,
};

export {WindowAction, Native, MouseButton};
