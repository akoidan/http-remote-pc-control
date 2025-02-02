import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';

@Injectable()
export class HotkeyService {
  constructor(
      private readonly logger: Logger,
      @Inject(Native)
      private readonly native: INativeModule
  ) {
  }

  unregister(): void {
    this.native.cleanupHotkeys();
  }

  registerShortcut(shortCut: string, cb: () => void): void {
    const keys = shortCut.split('+');
    if (keys.length !== 2) {
      throw new Error('Not implemented eyt');
    }
    let modifier = 0;
    if (keys[0].toLowerCase() === 'alt') {
      modifier = 1;
    } else if (keys[0].toLowerCase() === 'ctrl') {
      modifier = 2;
    }
    if (keys[0].toLowerCase() === 'shift') {
      modifier = 4;
    }
    if (keys[0].toLowerCase() === 'win') {
      modifier = 8;
    }
    if (keys[1].length !== 1) {
      throw new Error('Not implemented eyt');
    }
    const ret = this.native.registerHotkey(modifier, keys[1].charCodeAt(0), cb);
    this.logger.debug(`registering ${shortCut} shortcut`);
    if (!ret) {
      throw Error(`Cannot bind ${shortCut} shortcut`);
    }
  }
}
