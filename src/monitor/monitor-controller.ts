import {Controller, Get, Param, ParseIntPipe} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {MonitorService} from '@/monitor/monitor-service';
import {MonitorInfo} from '@/native/native-model';
import {
  MonitorIdResponse,
  MonitorIdResponseDto,
  MonitorInfoResponseDto,
  MonitorScaleFactorResponse,
  MonitorScaleFactorResponseDto,
} from '@/monitor/monitor-dto';

@ApiTags('Monitor')
@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get()
  @ApiOperation({summary: 'List monitors'})
  @ApiResponse({type: Number, isArray: true})
  getMonitors(): number[] {
    return this.monitorService.getMonitors();
  }

  @Get(':mid/info')
  @ApiOperation({summary: 'Get monitor info'})
  @ApiResponse({type: MonitorInfoResponseDto})
  getMonitorInfo(@Param('mid', ParseIntPipe) mid: number): MonitorInfo {
    return this.monitorService.getMonitorInfo(mid);
  }
}
