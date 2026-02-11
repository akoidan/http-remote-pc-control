import {Module} from '@nestjs/common';
import {KeyboardController} from '@/keyboard/keyboard-controller';
import {KeyboardService} from '@/keyboard/keyboard-service';
import {RandomModule} from '@/random/random.module';
import {KeyboardRouter} from '@/keyboard/keyboard-router';

@Module({
  imports: [RandomModule],
  controllers: [KeyboardController],
  providers: [
    KeyboardService,
    KeyboardRouter,
  ],
})

export class KeyboardModule {
}
