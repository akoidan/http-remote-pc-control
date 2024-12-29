import {Module} from '@nestjs/common';
import {AppController} from '@/event/app-controller';
import {KeyboardService} from "@/keyboard/keyboard-service";


@Module({
  controllers: [AppController],
  providers: [KeyboardService],
})
export class KeyboardModule {
}
