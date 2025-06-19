import {
  Logger,
  Module,
} from '@nestjs/common';
import {WindowController} from '@/window/window-controller';
import {WindowService} from '@/window/window-service';
import {NativeModule} from '@/native/native-module';

@Module({
  imports: [NativeModule],
  controllers: [WindowController],
  providers: [
    Logger,
    WindowService,
  ],
})
export class WindowModule {
}
