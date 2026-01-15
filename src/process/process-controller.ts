import {Body, Controller, Get, Inject, Param, ParseIntPipe, Post} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ProcessService} from '@/process/process-service';
import {CreateProcessRequestDto} from '@/window/window-dto';
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

  @Post('create')
  @ApiOperation({summary: 'Create process'})
  @ApiResponse({type: ProcessIdResponseDto})
  createProcess(@Body() body: CreateProcessRequestDto): ProcessIdResponse {
    return {pid: this.processService.createProcess(body.path, body.cmd)};
  }

  @Get(':pid/main-window')
  @ApiOperation({summary: 'Get process\' main window'})
  @ApiResponse({type: WindowHandleResponseDto})
  getProcessMainWindow(@Param('pid', ParseIntPipe) pid: number): WindowHandleResponse {
    return {wid: this.processService.getProcessMainWindow(pid)};
  }

  @Post('launch-exe')
  @ApiOperation({summary: 'Launch executable'})
  @ApiResponse({type: LaunchPidResponseDto})
  async lunchExe(@Body() body: LaunchExeRequestDto): Promise<LaunchPidResponse> {
    const pid = await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
    return {pid};
  }

  @Post('kill-exe-by-name')
  @ApiOperation({summary: 'Kill process by name'})
  async killExeByName(@Body() body: KillExeByNameRequestDto): Promise<void> {
    await this.executionService.killExeByName(body.name);
  }

  @Post('find-pids-by-name')
  @ApiOperation({summary: 'Returns processes ID list based on executable name'})
  async findPidByName(@Body() body: FindExeByNameRequestDto): Promise<number[]> {
    return this.executionService.findPidByName(body.name);
  }

  @Post('kill-exe-by-pid')
  @ApiOperation({summary: 'Kill process by PID'})
  async killExeByPid(@Body() body: KillExeByPidRequestDto): Promise<void> {
    await this.executionService.killExeByPid(body.pid);
  }
}
