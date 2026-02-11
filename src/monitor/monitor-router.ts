import {MonitorService} from '@/monitor/monitor-service';
import {Query, Router} from 'nestjs-trpc';
import {z} from 'zod';
import {Param, ParseIntPipe} from '@nestjs/common';
import {MonitorInfoResponseDto, monitorInfoSchema} from '@/monitor/monitor-dto';


@Router({alias: 'monitor'})
export class MonitorRouter {
  constructor(private readonly monitorService: MonitorService) {}

  @Query({output: z.array(z.number())})
  getMonitors(): number[] {
    return this.monitorService.getMonitors();
  }

  @Query({output: monitorInfoSchema, input: z.number()})
  getMonitorInfo(data: number): MonitorInfoResponseDto {
    return this.monitorService.getMonitorInfo(data);
  }
}

