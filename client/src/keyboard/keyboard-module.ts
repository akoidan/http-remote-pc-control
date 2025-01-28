import {
  Logger,
  Module,
} from '@nestjs/common';
import {KeyboardService} from '@/keyboard/keyboard-service';
import {KeyboardController} from '@/keyboard/keyboard-controller';


@Module({
  controllers: [KeyboardController],
  providers: [KeyboardService, Logger],
})
export class KeyboardModule {
}
