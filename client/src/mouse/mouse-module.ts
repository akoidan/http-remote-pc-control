import {Module} from '@nestjs/common';
import {MouseController} from '@/mouse/mouse-controller';
import {MouseService} from '@/mouse/mouse-service';
import { CustomLoggerModule } from '@/logger/custom-logger-module';

@Module({
  imports: [CustomLoggerModule],
  providers: [MouseService],
  controllers: [MouseController],
})
export class MouseModule {
}
