import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  FindExeByNameRequestDto, FindPidsByNameResponseDto,
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
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Execute')
@Controller('process')
export class ExecuteController {
  constructor(
    @Inject(ExecuteService)
    private readonly executionService: IExecuteService,
  ) {
  }

  @Post('launch-exe')
  @ApiOperation({summary: 'Launch executable'})
  @ApiBody({ type: LaunchExeRequestDto })
  @ApiResponse({type: LaunchPidResponseDto})
  async lunchExe(@Body() body: LaunchExeRequestDto): Promise<LaunchPidResponse> {
    const pid = await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
    return {pid};
  }

  @Post('kill-exe-by-name')
  @ApiOperation({summary: 'Kill process by name'})
  @ApiBody({ type: KillExeByNameRequestDto })
  async killExeByName(@Body() body: KillExeByNameRequestDto): Promise<void> {
    await this.executionService.killExeByName(body.name);
  }

  @Post('find-pids-by-name')
  @ApiOperation({summary: 'Returns processes ID list based on executable name'})
  @ApiBody({ type: FindExeByNameRequestDto })
  @ApiResponse({ type: FindPidsByNameResponseDto })
  async findPidByName(@Body() body: FindExeByNameRequestDto): Promise<FindPidsByNameResponseDto> {
    const pids  = await this.executionService.findPidByName(body.name);
    return {
      pids,
    };
  }

  @Post('kill-exe-by-pid')
  @ApiOperation({summary: 'Kill process by PID'})
  @ApiBody({ type: KillExeByPidRequestDto })
  async killExeByPid(@Body() body: KillExeByPidRequestDto): Promise<void> {
    await this.executionService.killExeByPid(body.pid);
  }
}
