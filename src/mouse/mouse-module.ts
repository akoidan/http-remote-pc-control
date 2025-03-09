import {
  Logger,
  Module,
} from '@nestjs/common';
import {MouseController} from '@/mouse/mouse-controller';
import {MouseService} from '@/mouse/mouse-service';

@Module({
  providers: [MouseService, Logger],
  controllers: [MouseController],
})
export class MouseModule {
}
