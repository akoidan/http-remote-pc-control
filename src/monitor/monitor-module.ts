import {Module} from '@nestjs/common';
import {MonitorController} from '@/monitor/monitor-controller';
import {MonitorService} from '@/monitor/monitor-service';
import {MonitorRouter} from '@/monitor/monitor-router';

@Module({
  controllers: [MonitorController],
  providers: [
    MonitorService,
    MonitorRouter,
  ],
})
export class MonitorModule {}
