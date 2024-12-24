import {
  app,
  globalShortcut
} from 'electron'

export class ElectronService {

  async bootstrap(): Promise<void> {
    console.log("Bootstraping electron service");
    await app.whenReady();
    app.on('will-quit', () => {
      globalShortcut.unregisterAll()
    });
  }

  registerShortcut(shortCut: string, cb: () => Promise<void>): void {
    const ret = globalShortcut.register(shortCut, cb);
    console.debug(`registering ${shortCut} shortcut`);
    if (!ret) {
      throw Error(`registration ${shortCut} failed`)
    }
  }

  async quit() {
    app.exit(1);
  }
}
