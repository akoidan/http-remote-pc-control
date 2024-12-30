import {Module} from '@nestjs/common';
import {KeyboardService} from '@/keyboard/keyboard-service';
import {KeyboardController} from '@/keyboard/keyboard-controller';


@Module({
  controllers: [KeyboardController],
  providers: [KeyboardService],
})
export class KeyboardModule {
}
