interface IWindowService {
  activateWindow(pid: number): Promise<void>;
}

interface UIWindow {
  id: number;
  processId: number;
  path: string;
}

export const WindowService = 'WindowService';

export type {
  UIWindow,
  IWindowService,
};
