import {Logger, Module} from '@nestjs/common';
import {ProcessController} from '@/process/process-controller';
import {ProcessService} from '@/process/process-service';
import {OS_INJECT} from '@/window/window-consts';
import os from 'os';

@Module({
  controllers: [ProcessController],
  providers: [
    {
      provide: OS_INJECT,
      useFactory: os.platform,
    },
    Logger,
    ProcessService,
  ],
})
export class ProcessModule {}
