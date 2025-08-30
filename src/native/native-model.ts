interface InitWindowResult {
  path: string;
  processId: number;
}

interface ActiveWindowInfo {
  wid: number;
  pid: number;
  path: string;
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

  getWindowBounds(id: number): { x: number; y: number; width: number; height: number };

  getWindowTitle(id: number): string;

  getWindowOpacity(id: number): number;

  getWindowOwner(id: number): number;

  isWindow(id: number): boolean;

  isWindowVisible(id: number): boolean;

  setWindowBounds(id: number, bounds: MonitorBounds): boolean;

  showWindow(id: number, type: WindowAction): boolean;

  setWindowOpacity(id: number, opacity: number): boolean;

  toggleWindowTransparency(id: number, toggle: boolean): boolean;

  setWindowOwner(id: number, owner: number): boolean;

  redrawWindow(id: number): boolean;
}

// New interface to represent monitor-related native APIs
interface MonitorNativeModule {
  getMonitors(): number[];

  getMonitorFromWindow(id: number): number;

  getMonitorScaleFactor(monitor: number): number;

  getMonitorInfo(monitor: number): MonitorBounds;
}

// New interface to represent process-related native APIs
interface ProcessNativeModule {
  createProcess(path: string, cmd?: string): number;

  getProcessMainWindow(pid: number): number;
}

interface KeyboardNativeModule {

  typeString(string: string): Promise<void>;

  keyTap(key: string, modifier: string[]): void;

  keyToggle(key: string, modifier: string[], down: boolean): void;
}

interface MouseNativeModule {
  mouseClick(): void;

  mouseMove(x: number, y: number): void;
}


interface INativeModule extends WindowNativeModule, MonitorNativeModule, ProcessNativeModule, KeyboardNativeModule, MouseNativeModule {
}

const Native = 'Native';

export type {
  InitWindowResult,
  INativeModule,
  MonitorBounds,
  MonitorInfo,
  WindowNativeModule,
  MonitorNativeModule,
  ProcessNativeModule,
  KeyboardNativeModule,
  MouseNativeModule,
};

export {WindowAction, Native};
