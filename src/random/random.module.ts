import {Logger, Module} from '@nestjs/common';
import {RandomService} from '@/random/random-service';

@Module({
  providers: [
    Logger,
    RandomService,
  ],
  exports: [RandomService],
})
export class RandomModule  {
}
