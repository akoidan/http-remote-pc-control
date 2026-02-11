import {MonitorService} from '@/monitor/monitor-service';
import {Query, Router} from 'nestjs-trpc';
import {z} from 'zod';
import {MonitorInfoResponseDto, monitorInfoSchema} from '@/monitor/monitor-dto';


@Router({alias: 'monitor'})
export class MonitorRouter {
  constructor(private readonly monitorService: MonitorService) {}

  @Query({output: z.array(z.number())})
  list(): number[] {
    return this.monitorService.getMonitors();
  }

  @Query({output: monitorInfoSchema, input: z.number()})
  info(data: number): MonitorInfoResponseDto {
    return this.monitorService.getMonitorInfo(data);
  }
}

