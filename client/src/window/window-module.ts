import {
  Logger,
  Module,
  NotImplementedException,
} from '@nestjs/common';
import os from 'os';
import {
  IWindowService,
  WindowService,
} from '@/window/window-model';
import {WindowWin32Service} from '@/window/os/window-win32-service';
import {WindowDarwinService} from '@/window/os/window-darwin.service';
import {WindowLinuxService} from '@/window/os/window-linux-service';
import {WindowController} from '@/window/window-controller';
import {
  INativeModule,
  Native,
} from '@/native/native-model';
import {NativeModule} from '@/native/native-module';

@Module({
  imports: [NativeModule],
  controllers: [WindowController],
  providers: [
    Logger,
    {
      provide: WindowService,
      inject: [Logger, Native],
      useFactory: (logger: Logger, addon: INativeModule): IWindowService => {
        const platform = os.platform();
        if (platform === 'win32') {
          return new WindowWin32Service(logger, addon);
        } else if (platform === 'linux') {
          return new WindowLinuxService(logger, addon);
        } else if (platform === 'darwin') {
          return new WindowDarwinService(logger);
        }
        throw new NotImplementedException(`Unsupported platform: ${platform}`);
      },
    },
  ],
})
export class WindowModule {
}
