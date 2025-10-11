/*
 eslint-disable no-await-in-loop
 */
import {Injectable, Logger} from '@nestjs/common';
import {IKeyboardService} from '@/keyboard/keyboard-model';
import {INativeModule} from '@/native/native-model';
import {sleep} from '@/shared';
import {RandomService} from '@/random/random-service';

@Injectable()
export class KeyboardWin32LinuxService implements IKeyboardService {
  constructor(
    private readonly logger: Logger,
    private readonly addon: INativeModule,
    private readonly rs: RandomService
  ) {
  }


  public async type(text: string, delay?: number, deviationDelay?: number): Promise<void> {
    this.logger.log(`Type: \u001b[35m${text}`);
    if (delay) {
      const realDelay = deviationDelay ? this.rs.calcDiviation(delay, deviationDelay) : delay;
      for (const char of text.split('')) {
        await sleep(realDelay); // sleep before, in case we are typing on the same pc the shorcut was triggered from
        // to avoid meta keys in keystrokes
        await this.addon.typeString(char);
      }
    } else {
      await this.addon.typeString(text);
    }
  }

  public async setKeyboardLayout(layout: string): Promise<void> {
      this.logger.log(`Setting keyboard layout to: ${layout}`);
      await this.addon.setKeyboardLayout(layout);
  }

  public async sendKey(keys: string[], holdKeys: string[], duration?: number): Promise<void> {
    for (const key of holdKeys) {
      this.logger.log(`HoldKey: \u001b[35m${key}`);
      // libnut.keyToggle(key, 'down', [])
      this.addon.keyToggle(key, [], true);
      await sleep(100);
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
      await sleep(100);
    }
    for (const key of holdKeys) {
      this.logger.log(`ReleaseKey: \u001b[35m${key}`);
      this.addon.keyToggle(key, [], false);
      await sleep(100);
    }
  }
}
