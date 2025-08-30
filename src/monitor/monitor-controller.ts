import {Controller, Get, Param, ParseIntPipe} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {MonitorService} from '@/monitor/monitor-service';
import {MonitorBounds} from "@/native/native-model";
import {MonitorsListResponseDto, MonitorInfoResponseDto} from '@/monitor/monitor-dto';

@ApiTags('Monitor')
@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get()
  @ApiOperation({summary: 'List monitors'})
  @ApiResponse({type: MonitorsListResponseDto})
  async getMonitors(): Promise<number[]> {
    return this.monitorService.getMonitors();
  }

  @Get(':mid/info')
  @ApiOperation({summary: 'Get monitor info'})
  @ApiResponse({type: MonitorInfoResponseDto})
  async getMonitorInfo(@Param('mid', ParseIntPipe) mid: number): Promise<MonitorBounds> {
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
