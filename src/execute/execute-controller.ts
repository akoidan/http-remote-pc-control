import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  KillExeByNameRequestDto,
  KillExeByPidRequestDto,
  LaunchExeRequestDto,
  LaunchPidResponse,
  LaunchPidResponseDto,
} from '@/execute/execute-dto';
import {
  ExecuteService,
  IExecuteService,
} from '@/execute/execute-model';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Execute')
@Controller()
export class ExecuteController {
  constructor(
    @Inject(ExecuteService)
    private readonly executionService: IExecuteService,
  ) {
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

  @Post('kill-exe-by-pid')
  @ApiOperation({summary: 'Kill process by PID'})
  async killExeByPid(@Body() body: KillExeByPidRequestDto): Promise<void> {
    await this.executionService.killExeByPid(body.pid);
  }
}
