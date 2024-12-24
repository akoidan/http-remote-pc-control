import {
  app,
  globalShortcut
} from 'electron'
import {
  Injectable,
  Logger
} from '@nestjs/common';

@Injectable()
export class ElectronService {

  constructor(private readonly logger: Logger) {
  }

  async bootstrap(): Promise<void> {
    this.logger.log("Bootstraping electron service");
    await app.whenReady();
    app.on('will-quit', () => {
      globalShortcut.unregisterAll()
    });
  }

  registerShortcut(shortCut: string, cb: () => Promise<void>): void {
    const ret = globalShortcut.register(shortCut, cb);
    this.logger.debug(`registering ${shortCut} shortcut`);
    if (!ret) {
      throw Error(`registration ${shortCut} failed`)
    }
  }
}
