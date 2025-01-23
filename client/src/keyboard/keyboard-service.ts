/*
 eslint-disable no-await-in-loop
 */
import {Injectable} from '@nestjs/common';
import {keyboard} from '@nut-tree-fork/nut-js';
import {
  InjectPinoLogger,
  PinoLogger,
} from 'nestjs-pino';
import {invertedMap} from '@/keyboard/keyboard-dto';
import os from 'os';

@Injectable()
export class KeyboardService {
  private readonly platform = os.platform(); // Detect OS

  constructor(
    @InjectPinoLogger(KeyboardService.name)
    private readonly logger: PinoLogger
  ) {
  }

  private readonly specialCharacters = '$';

  public async type(text: string): Promise<void> {
    if (text.includes(this.specialCharacters) && this.platform === 'linux') {
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
      await new Promise(resolve => {
        setTimeout(resolve, 10);
      });
    }
    for (const key of holdKeys) {
      this.logger.debug(`ReleaseKey: \u001b[35m${key}`);
      await keyboard.releaseKey(invertedMap.get(key)!);
    }
    await new Promise((resolve) => {setTimeout(resolve, 10);});
  }

  private async typeWithSpecialCharacters(text: string): Promise<void> {
    const parts = text.split('$');
    for (let i = 0; i < parts.length; i++) {
      this.logger.debug(`Type: \u001b[35m${parts[i]}`);
      await keyboard.type(parts[i]);
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      await new Promise((resolve) => {setTimeout(resolve, 10);});
      if (i < parts.length - 1) {
        await this.sendKey(['4'], ['shift']);
      }
    }
  }
}
