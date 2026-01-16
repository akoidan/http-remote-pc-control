interface InitWindowResult {
  path: string;
  processId: number;
}

interface ActiveWindowInfo {
  wid: number;
  pid: number;
  path: string;
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
  isPrimary: boolean
}

enum WindowAction {
  SHOW = 'show',
  HIDE = 'hide',
  MINIMIZE = 'minimize',
  RESTORE = 'restore',
  MAXIMIZE = 'maximize',
}

interface WindowNativeModule {
  bringWindowToTop(id: number): void;

  getWindows(): number[];

  initWindow(id: number): InitWindowResult;

  getActiveWindowInfo(): ActiveWindowInfo;

  // Window methods
  getActiveWindow(): number;

  getWindowBounds(id: number): WindowBounds;

  getWindowTitle(id: number): string;

  getWindowOpacity(id: number): number;

  getWindowOwner(id: number): number;

  isWindow(id: number): boolean;

  isWindowVisible(id: number): boolean;

  setWindowBounds(id: number, bounds: MonitorBounds): void;

  showWindow(id: number, type: WindowAction): void;

  setWindowOpacity(id: number, opacity: number): void;

  toggleWindowTransparency(id: number, toggle: boolean): void;

  setWindowOwner(id: number, owner: number): void;

  redrawWindow(id: number): void;
}

// New interface to represent monitor-related native APIs
interface MonitorNativeModule {
  getMonitors(): number[];

  getMonitorFromWindow(id: number): number;

  getMonitorScaleFactor(monitor: number): number;

  getMonitorInfo(monitor: number): MonitorInfo;
}

// New interface to represent process-related native APIs
interface ProcessNativeModule {
  createProcess(path: string, cmd?: string): number;

  getProcessMainWindow(pid: number): number;
}

interface KeyboardNativeModule {
  typeString(string: string): void;

  keyTap(key: string, modifier: string[]): void;

  keyToggle(key: string, modifier: string[], down: boolean): void;

  setKeyboardLayout(layout: string): void;
}

interface MouseNativeModule {
  mouseClick(): void;

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

export {WindowAction, Native};
