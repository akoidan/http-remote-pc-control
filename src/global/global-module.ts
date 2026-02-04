import {Global, Logger, Module} from '@nestjs/common';
import {OS_INJECT} from '@/global/global-model';
import os from 'os';

@Global()
@Module({
  providers: [
    Logger,
    {
      provide: OS_INJECT,
      useFactory: os.platform,
    },
  ],
  exports: [Logger, OS_INJECT],
})
export class GlobalModule {
}
