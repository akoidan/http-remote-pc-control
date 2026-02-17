import {Inject, Injectable, Logger} from '@nestjs/common';
import {KeyboardNativeModule, Native} from '@/native/native-model';
import {sleep} from '@/app/shared';
import {RandomService} from '@/random/random-service';
import {KeyPressRequest, SetKeyboardLayoutRequest, TypeTextRequest} from '@/keyboard/keyboard-dto';
import {Safe400} from '@/utils/decorators';
import {OS_INJECT} from '@/global/global-model';

@Injectable()
export class KeyboardService {
  constructor(
    readonly logger: Logger,
    @Inject(OS_INJECT)
    readonly os: NodeJS.Platform,
    @Inject(Native)
    private readonly addon: KeyboardNativeModule,
    private readonly rs: RandomService
  ) {
  }


  @Safe400(['win32', 'linux'])
  public async typeText(body: TypeTextRequest): Promise<void> {
    this.logger.log(`Type: \u001b[35m${body.text}`);
    if (body.keyDelay) {
      let realDelay = body.keyDelay;
      for (const char of body.text.split('')) {
        if (body.keyDelayDeviation) {
          realDelay =  this.rs.calcDeviation(body.keyDelay, body.keyDelayDeviation);
        }
        await sleep(realDelay); // sleep before, in case we are typing on the same pc the shorcut was triggered from
        // to avoid meta keys in keystrokes
        this.addon.typeString(char);
      }
    } else {
      this.addon.typeString(body.text);
    }
  }

  @Safe400(['win32', 'linux'])
  public setLayout(body: SetKeyboardLayoutRequest): void {
    this.addon.setKeyboardLayout(body.layout);
  }

  @Safe400(['win32', 'linux'])
  public async keyPress(body: KeyPressRequest): Promise<void> {
    for (const key of (body.holdKeys ?? [])) {
      this.logger.log(`HoldKey: \u001b[35m${key}`);
      // libnut.keyToggle(key, 'down', [])
      this.addon.keyToggle(key, [], true);
      await sleep(100);
    }
    for (const key of body.keys) {
      this.logger.log(`KeyPress: \u001b[35m${key}`);
      if (body.duration) {
        this.addon.keyToggle(key, [], true);
        await sleep(body.duration);
        this.addon.keyToggle(key, [], false);
      } else {
        this.addon.keyTap(key, []);
      }
      await sleep(100);
    }
    for (const key of (body.holdKeys ?? [])) {
      this.logger.log(`ReleaseKey: \u001b[35m${key}`);
      this.addon.keyToggle(key, [], false);
      await sleep(100);
    }
  }
}
