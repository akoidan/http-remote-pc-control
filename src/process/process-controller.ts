import {Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseIntPipe, Post, Query} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ProcessService} from '@/process/process-service';
import {
  FindExeByNameRequestDto, LaunchExeRequestDto,
  ProcessResponseDto,
} from '@/process/process-dto';
import {ExecuteService, IExecuteService} from '@/process/process-model';

@ApiTags('Process')
@Controller('process')
export class ProcessController {
  constructor(
    private readonly processService: ProcessService,
    @Inject(ExecuteService)
    private readonly executionService: IExecuteService,
  ) {
  }

  @Get(':pid')
  @ApiOperation({summary: 'Get all windows with their IDs for a concrete process id'})
  @ApiResponse({type: Number, isArray: true})
  getWindowsIdByPid(@Param('id', ParseIntPipe) id: number): ProcessResponseDto {
    return this.processService.getProcessInfo(id);
  }

  @Post()
  @ApiOperation({summary: 'Launches an application'})
  @ApiResponse({type: ProcessResponseDto})
  async createProcess(@Body() body: LaunchExeRequestDto): Promise<ProcessResponseDto> {
    return this.processService.createProcess(body);
  }

  @Delete()
  @ApiOperation({summary: 'Kill process by name'})
  @HttpCode(204)
  async killExeByName(@Query() query: FindExeByNameRequestDto): Promise<void> {
    await this.executionService.killExeByName(query.name);
  }

  @Get()
  @ApiResponse({type: Number, isArray: true})
  @ApiOperation({summary: 'Returns processes ID list based on executable name'})
  async findPidByName(@Query() query: FindExeByNameRequestDto): Promise<number[]> {
    return this.executionService.findPidByName(query.name);
  }

  @Delete(':pid')
  @ApiOperation({summary: 'Kill process by PID'})
  @HttpCode(204)
  async killExeByPid(@Param('mid', ParseIntPipe) pid: number): Promise<void> {
    await this.executionService.killExeByPid(pid);
  }
}
