import {GlobalKeyboardListener} from 'node-global-key-listener';

import {
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class HotkeyService {
  private readonly listener = new GlobalKeyboardListener();

  constructor(private readonly logger: Logger) {

  }

  async bootstrap(): Promise<void> {
    this.logger.debug('Waiting for electron app to init...');
    await app.whenReady();
    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
    });
  }

  shutdown(): void {
    this.logger.log('Shutting down electron service...');
    app.exit(1);
  }

  registerShortcut(shortCut: string, cb: () => void): void {
    const ret = globalShortcut.register(shortCut, cb);
    this.logger.debug(`registering ${shortCut} shortcut`);
    if (!ret) {
      throw Error(`Cannot bind ${shortCut} shortcut`);
    }
  }
}
