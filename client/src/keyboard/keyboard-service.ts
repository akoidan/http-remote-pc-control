/*
 eslint-disable no-await-in-loop
 */
import { Injectable } from '@nestjs/common';
import {
  Key,
  keyboard,
} from '@nut-tree-fork/nut-js';
import {
  InjectPinoLogger,
  PinoLogger,
} from 'nestjs-pino';
import { invertedMap } from '@/keyboard/keyboard-dto';

@Injectable()
export class KeyboardService {
  constructor(
    @InjectPinoLogger(KeyboardService.name)
    private readonly logger: PinoLogger
  ) {
  }

  async sendKey(key: string): Promise<void> {
    const keymap: Key = invertedMap.get(key)!;
    this.logger.info(`KeyPress: \u001b[35m${key}`);
    await keyboard.type(keymap);
  }

  private readonly specialCharacters = '$';

  async type(text: string): Promise<void> {
    if (text.includes(this.specialCharacters)) {
      await this.typeWithSpecialCharacters(text);
    } else {
      this.logger.info(`Type: \u001b[35m${text}`);
      await keyboard.type(text);
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
