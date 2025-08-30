import {Logger, Module} from '@nestjs/common';
import {MonitorController} from '@/monitor/monitor-controller';
import {MonitorService} from '@/monitor/monitor-service';
import {OS_INJECT} from '@/window/window-consts';
import os from 'os';

@Module({
  controllers: [MonitorController],
  providers: [
    {
      provide: OS_INJECT,
      useFactory: os.platform,
    },
    Logger,
    MonitorService,
  ],
})
export class MonitorModule {}
