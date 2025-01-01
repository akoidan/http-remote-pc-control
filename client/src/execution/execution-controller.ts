import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import {ExecutionService} from '@/execution/execution.service';
import {
  KillExeRequest,
  LaunchExeRequest,
} from '@/execution/execution-dto';

@Controller()
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
  ) {
  }

  @Post('launch-exe')
  async lunchExe(@Body() body: LaunchExeRequest): Promise<void> {
    await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
  }

  @Post('kill-exe')
  async killExe(@Body() body: KillExeRequest): Promise<void> {
    await this.executionService.killExe(body.name);
  }
}
