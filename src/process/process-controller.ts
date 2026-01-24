import {Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ProcessService} from '@/process/process-service';
import {CreateProcessRequestDto, FocusExeRequestDto} from '@/window/window-dto';
import {
  FindExeByNameRequestDto,
  KillExeByNameRequestDto,
  KillExeByPidRequestDto,
  LaunchExeRequestDto,
  LaunchPidResponse,
  LaunchPidResponseDto,
  ProcessIdResponse,
  ProcessIdResponseDto,
  WindowHandleResponse,
  WindowHandleResponseDto,
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


  @Get(':pid/main-window')
  @ApiOperation({summary: 'Get process\' main window'})
  @ApiResponse({type: WindowHandleResponseDto})
  getProcessMainWindow(@Param('pid', ParseIntPipe) pid: number): WindowHandleResponse {
    return {wid: this.processService.getProcessMainWindow(pid)};
  }

  @Get(':pid/windows')
  @ApiOperation({summary: 'Get all windows with their IDs for a concrete process id'})
  @ApiResponse({type: Number, isArray: true})
  async getWindowsIdByPid(@Param('id', ParseIntPipe) id: number): Promise<number[]> {
    return this.processService.getAllWindowsByPid(id);
  }

  @Put()
  @ApiOperation({summary: 'Launches an application'})
  @ApiResponse({type: ProcessIdResponseDto})
  createProcess(@Body() body: CreateProcessRequestDto): ProcessIdResponse {
    return {pid: this.processService.createProcess(body.path, body.cmd)};
  }

  @Post(':pid/focus')
  @ApiOperation({summary: 'Focus main process window'})
  async focusExe(@Body() body: FocusExeRequestDto): Promise<void> {
    await this.processService.activateWindowByPid(body.pid);
  }

  @Post()
  @ApiOperation({summary: 'Launches an application (same as put but from nodejsapi)'})
  @ApiResponse({type: LaunchPidResponseDto})
  async lunchExe(@Body() body: LaunchExeRequestDto): Promise<LaunchPidResponse> {
    const pid = await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
    return {pid};
  }

  @Delete()
  @ApiOperation({summary: 'Kill process by name'})
  async killExeByName(@Query() query: KillExeByNameRequestDto): Promise<void> {
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
  async killExeByPid(@Body() body: KillExeByPidRequestDto): Promise<void> {
    await this.executionService.killExeByPid(body.pid);
  }
}
