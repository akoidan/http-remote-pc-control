import {Module} from '@nestjs/common';
import {WindowController} from '@/window/window-controller';
import {WindowService} from '@/window/window-service';

@Module({
  controllers: [WindowController],
  providers: [
    WindowService,
  ],
})
export class WindowModule {
}
