import {Logger, Module, NotImplementedException} from '@nestjs/common';
import {KeyboardController} from '@/keyboard/keyboard-controller';
import os from 'os';
import {KeyboardWin32LinuxService} from '@/keyboard/os/keyboard-win32-linux-service';
import {IKeyboardService, KeyboardService} from '@/keyboard/keyboard-model';
import {KeyboardDarwinService} from '@/keyboard/os/keyboard-darwin-service';
import {INativeModule, Native} from '@/native/native-model';
import {RandomModule} from '@/random/random.module';
import {RandomService} from '@/random/random-service';

@Module({
  imports: [RandomModule],
  controllers: [KeyboardController],
  providers: [
    Logger,
    {
      provide: KeyboardService,
      inject: [Logger, Native, RandomService],
      useFactory: (logger: Logger, addon: INativeModule, rs: RandomService): IKeyboardService => {
        const platform = os.platform();
        if (platform === 'win32' || platform === 'linux') {
          return new KeyboardWin32LinuxService(logger, addon, rs);
        } else if (platform === 'darwin') {
          return new KeyboardDarwinService(logger);
        }
        throw new NotImplementedException(`Unsupported platform: ${platform}`);
      },
    },
  ],
})

export class KeyboardModule {
}
