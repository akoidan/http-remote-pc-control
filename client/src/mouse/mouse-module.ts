import {
  Logger,
  Module,
} from '@nestjs/common';
import {MouseController} from '@/mouse/mouse-controller';
import {MouseService} from '@/mouse/mouse-service';
import {NativeModule} from '@/native/native-module';

@Module({
  providers: [MouseService, Logger],
  controllers: [MouseController],
  imports: [NativeModule],
})
export class MouseModule {
}
