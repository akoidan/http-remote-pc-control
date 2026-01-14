import {Controller, Get, Param, ParseIntPipe} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {MonitorService} from '@/monitor/monitor-service';
import {MonitorBounds, MonitorInfo} from '@/native/native-model';
import {MonitorInfoResponseDto} from '@/monitor/monitor-dto';

@ApiTags('Monitor')
@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get()
  @ApiOperation({summary: 'List monitors'})
  getMonitors(): number[] {
    return this.monitorService.getMonitors();
  }

  @Get(':mid/info')
  @ApiOperation({summary: 'Get monitor info'})
  @ApiResponse({type: MonitorInfoResponseDto})
  getMonitorInfo(@Param('mid', ParseIntPipe) mid: number): MonitorInfo {
    return this.monitorService.getMonitorInfo(mid);
  }

  @Get('from-window/:wid')
  @ApiOperation({summary: 'Get monitor for window'})
  getMonitorFromWindow(@Param('wid', ParseIntPipe) wid: number): number {
    return this.monitorService.getMonitorFromWindow(wid);
  }

  @Get(':mid/scale')
  @ApiOperation({summary: 'Get monitor scale factor'})
  getMonitorScaleFactor(@Param('mid', ParseIntPipe) mid: number): number {
    return this.monitorService.getMonitorScaleFactor(mid);
  }
}
