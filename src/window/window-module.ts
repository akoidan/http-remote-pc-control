import {Logger, Module} from '@nestjs/common';
import {WindowController} from '@/window/window-controller';
import {WindowService} from '@/window/window-service';
import {OS_INJECT} from '@/window/window-consts';
import os from 'os';

@Module({
  controllers: [WindowController],
  providers: [
    {
      provide: OS_INJECT,
      useFactory: os.platform,
    },
    Logger,
    WindowService,
  ],
})
export class WindowModule {
}
