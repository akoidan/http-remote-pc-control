import {Controller, Get, Param, ParseIntPipe} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {MonitorService} from '@/monitor/monitor-service';

@ApiTags('Monitor')
@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get()
  @ApiOperation({summary: 'List monitors'})
  async getMonitors(): Promise<number[]> {
    return this.monitorService.getMonitors();
  }

  @Get(':mid/info')
  @ApiOperation({summary: 'Get monitor info'})
  async getMonitorInfo(@Param('mid', ParseIntPipe) mid: number) {
    return this.monitorService.getMonitorInfo(mid);
  }

  @Get('from-window/:wid')
  @ApiOperation({summary: 'Get monitor for window'})
  async getMonitorFromWindow(@Param('wid', ParseIntPipe) wid: number): Promise<number> {
    return this.monitorService.getMonitorFromWindow(wid);
  }

  @Get(':mid/scale')
  @ApiOperation({summary: 'Get monitor scale factor'})
  async getMonitorScaleFactor(@Param('mid', ParseIntPipe) mid: number): Promise<number> {
    return this.monitorService.getMonitorScaleFactor(mid);
  }
}
