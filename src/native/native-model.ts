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
