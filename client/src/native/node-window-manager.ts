import os from 'os';

const addon = os.platform() === 'win32' ? require('./win32/window.node') : new Proxy({}, {
  get(_, property) {
    return () => {
      throw new Error(`OS ${os.platform()} is not support to call ${property as string}`);
    };
  },
});


interface Window {
  id: number;
  processId: number;
  path: string;
}

export async function keyPress(key: string): Promise<void> {
  return addon.simulateKeypressAsync(key.charAt(0));
}

export function type(text: string) {
  return addon.simulateTyping(text);
}

export function getAllWindows(): Window[] {
  return addon.getWindows().map((id: number) => {
    const initRes = addon.initWindow(id);
    return {
      id,
      path: initRes.path,
      processId: initRes.processId,
    };
  });
}

export function bringWindoToTop(windowId: number): void {
  addon.bringWindowToTop(windowId);
}
