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
  lunchExe(@Body() body: LaunchExeRequest): void {
    this.executionService.launchExe(body.path);
  }

  @Post('kill-exe')
  async killExe(@Body() body: KillExeRequest): Promise<void> {
    await this.executionService.killExe(body.name);
  }
}
