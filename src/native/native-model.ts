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

interface WindowInfo {
  wid: number;
  pid: number;
  path: string;
  bounds: WindowBounds;
  opacity: number;
  title: number;
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
  // Window management
  setWindowActive(handle: number): boolean;
  getWindowActiveId(): number;
  getWindowsByProcessId(pid: number): number[];
  setWindowState(handle: number, visibility: WindowAction): void;
  getWindowInfo(handle: number): WindowInfo;
  setWindowBounds(handle: number, bounds: WindowBounds): void;
  
  // Window transparency
  setWindowIsTransparent(handle: number, enabled: boolean): void;
  setWindowOpacity(handle: number, opacity: number): void;
}

interface MonitorNativeModule {
  getMonitors(): number[];
  getMonitorFromWindow(handle: number): number;
  getMonitorInfo(monitor: number): MonitorInfo;
}

interface ProcessNativeModule {
  createProcess(path: string, cmd?: string): number;
  isProcessElevated(): boolean;
}

interface KeyboardNativeModule {
  typeString(text: string): void;
  keyTap(key: string, modifiers: string[]): void;
  keyToggle(key: string, modifiers: string[], down: boolean): void;
  setKeyboardLayout(layout: string): void;
}

interface MouseNativeModule {
  setMouseButtonToState(button: MouseButton, isDown: boolean): void;
  setMousePosition(pos: MousePosition): void;
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
