interface InitWindowResult {
  path: string;
  processId: number;
}

interface ActiveWindowInfo {
  wid: number;
  pid: number;
  path: string;
}

interface WindowNativeModule {
  bringWindowToTop(id: number): void;
  getWindows(): number[];
  initWindow(id: number): InitWindowResult;
  getActiveWindowInfo(): ActiveWindowInfo;

  // Additional methods exposed by win32/native window.cc
  getActiveWindow(): number;
  getProcessMainWindow(pid: number): number;
  createProcess(path: string, cmd?: string): number;
  getMonitors(): number[];
  getMonitorFromWindow(id: number): number;
  getMonitorScaleFactor(monitor: number): number;
  getMonitorInfo(monitor: number): { bounds: { x: number; y: number; width: number; height: number; }; workArea: { x: number; y: number; width: number; height: number; }; isPrimary: boolean };
  getWindowBounds(id: number): { x: number; y: number; width: number; height: number };
  getWindowTitle(id: number): string;
  getWindowOpacity(id: number): number;
  getWindowOwner(id: number): number;
  isWindow(id: number): boolean;
  isWindowVisible(id: number): boolean;
  setWindowBounds(id: number, bounds: { x: number; y: number; width: number; height: number }): boolean;
  showWindow(id: number, type: 'show' | 'hide' | 'minimize' | 'restore' | 'maximize'): boolean;
  setWindowOpacity(id: number, opacity: number): boolean;
  toggleWindowTransparency(id: number, toggle: boolean): boolean;
  setWindowOwner(id: number, owner: number): boolean;
  redrawWindow(id: number): boolean;
}

interface KeyboardNativeModule {

  typeString(string: string): Promise<void>;

  keyTap(key: string, modifier: string[]): void;

  keyToggle(key: string, modifier:string[], down: boolean): void;
}

interface MouseNativeModule {
  mouseClick(): void;
  mouseMove(x: number, y: number): void;
}


interface INativeModule extends WindowNativeModule, KeyboardNativeModule, MouseNativeModule {
}

export const Native = 'Native';

export type {
  InitWindowResult,
  INativeModule,
};
