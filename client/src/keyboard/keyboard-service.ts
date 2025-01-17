/*
 eslint-disable no-await-in-loop
 */
import {Injectable} from '@nestjs/common';
import {
  Key,
  keyboard,
} from '@nut-tree-fork/nut-js';
import {
  InjectPinoLogger,
  PinoLogger,
} from 'nestjs-pino';
import {invertedMap} from '@/keyboard/keyboard-dto';

@Injectable()
export class KeyboardService {
  constructor(
    @InjectPinoLogger(KeyboardService.name)
    private readonly logger: PinoLogger
  ) {
  }

  private readonly specialCharacters = '$';

  public async type(text: string): Promise<void> {
    if (text.includes(this.specialCharacters)) {
      await this.typeWithSpecialCharacters(text);
    } else {
      this.logger.info(`Type: \u001b[35m${text}`);
      await keyboard.type(text);
    }
  }

  public async sendKey(keys: string[], holdKeys: string[]): Promise<void> {
    for (const key of holdKeys) {
      this.logger.debug(`HoldKey: \u001b[35m${key}`);
      await keyboard.pressKey(invertedMap.get(key)!);
    }
    for (const key of keys) {
      this.logger.debug(`KeyPress: \u001b[35m${key}`);
      await keyboard.type(invertedMap.get(key)!);
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      await new Promise(resolve => {setTimeout(resolve, 10);});
    }
    for (const key of holdKeys) {
      this.logger.debug(`ReleaseKey: \u001b[35m${key}`);
      await keyboard.releaseKey(invertedMap.get(key)!);
    }
  }

  private async typeWithSpecialCharacters(text: string): Promise<void> {
    const parts = text.split(this.specialCharacters);
    for (let i = 0; i < parts.length; i++) {
      this.logger.debug(`Type: \u001b[35m${text}`);
      await keyboard.type(parts[i]);
      if (i < parts.length - 1) {
        this.logger.debug('Type: \u001b[35m$4');
        await keyboard.pressKey(Key.LeftShift);
        await keyboard.type('4');
        await keyboard.releaseKey(Key.LeftShift);
      }
    }
  }
}
