/*
 eslint-disable no-await-in-loop
 */
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {IKeyboardService} from '@/keyboard/keyboard-model';
import {INativeModule} from '@/native/native-model';
import {sleep} from '@/shared';

@Injectable()
export class KeyboardWin32LinuxService implements IKeyboardService {
  constructor(
    private readonly logger: Logger,
    private readonly addon: INativeModule
  ) {
  }


  public async type(text: string): Promise<void> {
    this.logger.log(`Type: \u001b[35m${text}`);
    await this.addon.typeString(text);
  }

  public async sendKey(keys: string[], holdKeys: string[], duration?: number): Promise<void> {
    for (const key of holdKeys) {
      this.logger.log(`HoldKey: \u001b[35m${key}`);
      // libnut.keyToggle(key, 'down', [])
      this.addon.keyToggle(key, [], true);
      await sleep(50);
    }
    for (const key of keys) {
      this.logger.log(`KeyPress: \u001b[35m${key}`);
      if (duration) {
        this.addon.keyToggle(key, [], true);
        await sleep(duration);
        this.addon.keyToggle(key, [], false);
      } else {
        this.addon.keyTap(key, []);
      }
      await sleep(50);
    }
    for (const key of holdKeys) {
      this.logger.log(`ReleaseKey: \u001b[35m${key}`);
      this.addon.keyToggle(key, [], false);
      await sleep(50);
    }
  }
}
