import {
  Logger,
  Module,
  NotImplementedException,
} from '@nestjs/common';
import {KeyboardController} from '@/keyboard/keyboard-controller';
import os from 'os';
import {KeyboardWin32LinuxService} from '@/keyboard/os/keyboard-win32-linux-service';
import {
  IKeyboardService,
  KeyboardService,
} from '@/keyboard/keyboard-model';
import {KeyboardDarwinService} from '@/keyboard/os/keyboard-darwin-service';
import {
  INativeModule,
  Native,
} from '@/native/native-model';

@Module({
  controllers: [KeyboardController],
  providers: [
    Logger,
    {
      provide: KeyboardService,
      inject: [Logger, Native],
      useFactory: (logger: Logger, addon: INativeModule): IKeyboardService => {
        const platform = os.platform();
        if (platform === 'win32' || platform === 'linux') {
          return new KeyboardWin32LinuxService(logger, addon);
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
