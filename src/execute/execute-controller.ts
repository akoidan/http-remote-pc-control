import {
  Controller,
  Inject,
  Post,
  Body,
} from '@nestjs/common';
import {
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchExeRequest,
  LaunchPidResponse,
  LaunchExeRequestDto,
  KillExeByNameRequestDto,
  KillExeByPidRequestDto,
  LaunchPidResponseDto,
} from '@/execute/execute-dto';
import {
  ExecuteService,
  IExecuteService,
} from '@/execute/execute-model';
import {ApiTags, ApiOperation, ApiBody, ApiResponse} from '@nestjs/swagger';

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
  @ApiBody({type: LaunchExeRequestDto})
  @ApiResponse({type: LaunchPidResponseDto})
  async lunchExe(@Body() body: LaunchExeRequest): Promise<LaunchPidResponse> {
    const pid = await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
    return {pid};
  }

  @Post('kill-exe-by-name')
  @ApiOperation({summary: 'Kill process by name'})
  @ApiBody({type: KillExeByNameRequestDto})
  async killExeByName(@Body() body: KillExeByNameRequest): Promise<void> {
    await this.executionService.killExeByName(body.name);
  }

  @Post('kill-exe-by-pid')
  @ApiOperation({summary: 'Kill process by PID'})
  @ApiBody({type: KillExeByPidRequestDto})
  async killExeByPid(@Body() body: KillExeByPidRequest): Promise<void> {
    await this.executionService.killExeByPid(body.pid);
  }
}
