import {Module} from '@nestjs/common';
import {MonitorController} from '@/monitor/monitor-controller';
import {MonitorService} from '@/monitor/monitor-service';

@Module({
  controllers: [MonitorController],
  providers: [
    MonitorService,
  ],
})
export class MonitorModule {}
