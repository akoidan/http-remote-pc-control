import {Injectable} from '@nestjs/common';
import {
  Key,
  keyboard,
} from '@nut-tree-fork/nut-js';
import {PinoLogger, InjectPinoLogger} from 'nestjs-pino';
import {invertedMap} from '@/keyboard/keyboard-dto';

@Injectable()
export class KeyboardService {
  constructor(
    @InjectPinoLogger(KeyboardService.name)
    private readonly logger: PinoLogger
  ) {
  }

  async sendKey(key: string): Promise<void> {
    const keymap: Key = invertedMap.get(key);
    this.logger.info(`Key: \u001b[35m${key}\u001b`);
    await keyboard.type(keymap);
  }

  async type(text: string): Promise<void> {
    this.logger.info(`Type: \u001b[35m${text}\u001b`);
    await keyboard.type(text);
  }
}
