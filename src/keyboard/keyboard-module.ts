import {Logger, Module} from '@nestjs/common';
import {KeyboardController} from '@/keyboard/keyboard-controller';
import {KeyboardService} from '@/keyboard/keyboard-service';
import {RandomModule} from '@/random/random.module';

@Module({
  imports: [RandomModule],
  controllers: [KeyboardController],
  providers: [
    KeyboardService,
  ],
})

export class KeyboardModule {
}
