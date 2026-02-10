interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowInfo {
  wid: number;
  pid: number;
  path: string;
  bounds: WindowBounds;
  opacity?: number;
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
  bringWindowToTop(handle: number): boolean;
  getActiveWindowId(): number;
  getWindowsByProcessId(pid: number): number[];
  setWindowVisibility(handle: number, visible: boolean): void;
  getWindowInfo(handle: number): WindowInfo;
  setWindowBounds(handle: number, bounds: WindowBounds): void;
  setVisibility(handle: number, action: WindowAction): void;
  
  // Window transparency
  toggleWindowTransparency(handle: number, enabled: boolean): void;
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
  mouseClick(button: MouseButton): void;
  mouseMove(x: number, y: number): void;
  getMousePos(): { x: number; y: number };
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
