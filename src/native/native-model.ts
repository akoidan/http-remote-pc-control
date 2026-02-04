interface InitWindowResult {
  path: string;
  processId: number;
}

interface WindowInfo {
  wid: number;
  pid: number;
  path: string;
  bounds: WindowBounds;
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number
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
  isPrimary: boolean
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
  bringWindowToTop(id: number): void;
  getWindowsByProcessId(pid: number): number[];
  setWindowBounds(id: number, bounds: MonitorBounds): void;
  getWindowInfo(id: number): WindowInfo;
  getActiveWindowId(): number;
}

// New interface to represent monitor-related native APIs
interface MonitorNativeModule {
  getMonitors(): number[];

  getMonitorFromWindow(id: number): number;

  getMonitorInfo(monitor: number): MonitorInfo;
}

// New interface to represent process-related native APIs
interface ProcessNativeModule {
  createProcess(path: string, cmd?: string): number;
  isProcessElevated(): boolean;
}

interface KeyboardNativeModule {
  typeString(string: string): void;

  keyTap(key: string, modifier: string[]): void;

  keyToggle(key: string, modifier: string[], down: boolean): void;

  setKeyboardLayout(layout: string): void;
}

interface MouseNativeModule {
  mouseClick(button: MouseButton): void;

  mouseMove(x: number, y: number): void;

  getMousePos(): { x: number; y: number };
}


interface INativeModule extends WindowNativeModule, MonitorNativeModule, ProcessNativeModule, KeyboardNativeModule, MouseNativeModule {
  // loaded by nodejs
  path: string;
}

const Native = 'Native';

export type {
  InitWindowResult,
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
