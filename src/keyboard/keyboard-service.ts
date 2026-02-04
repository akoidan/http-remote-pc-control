import {Inject, Injectable, Logger} from '@nestjs/common';
import {INativeModule} from '@/native/native-model';
import {sleep} from '@/shared';
import {RandomService} from '@/random/random-service';
import {KeyboardLayoutValue} from '@/keyboard/keyboard-dto';
import {Safe400} from "@/utils/decorators";
import {OS_INJECT} from "@/global/global-model";

@Injectable()
export class KeyboardService {
  constructor(
    readonly logger: Logger,
    @Inject(OS_INJECT)
    readonly os: NodeJS.Platform,
    private readonly addon: INativeModule,
    private readonly rs: RandomService
  ) {
  }


  @Safe400(['darwin'])
  public async typeText(text: string, delay?: number, deviationDelay?: number): Promise<void> {
    this.logger.log(`Type: \u001b[35m${text}`);
    if (delay) {
      const realDelay = deviationDelay ? this.rs.calcDeviation(delay, deviationDelay) : delay;
      for (const char of text.split('')) {
        await sleep(realDelay); // sleep before, in case we are typing on the same pc the shorcut was triggered from
        // to avoid meta keys in keystrokes
        this.addon.typeString(char);
      }
    } else {
      this.addon.typeString(text);
    }
  }

  @Safe400(['darwin'])
  public setLayout(layout: KeyboardLayoutValue): void {
    this.addon.setKeyboardLayout(layout);
  }

  @Safe400(['darwin'])
  public async keyPress(keys: string[], holdKeys: string[], duration?: number): Promise<void> {
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
