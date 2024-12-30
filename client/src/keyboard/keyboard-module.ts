import {Module} from '@nestjs/common';
import {KeyboardService} from '@/keyboard/keyboard-service';
import {KeyboardController} from '@/keyboard/keyboard-controller';
import {CustomLoggerModule} from '@/logger/custom-logger-module';


@Module({
  imports: [CustomLoggerModule],
  controllers: [KeyboardController],
  providers: [KeyboardService],
})
export class KeyboardModule {
}
