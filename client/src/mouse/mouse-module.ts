import {Module} from '@nestjs/common';
import {MouseController} from "@/mouse/mouse-controller";
import {MouseService} from "@/mouse/mouse-service";

@Module({
  providers: [MouseService],
  controllers: [MouseController],
})
export class MouseModule {
}
