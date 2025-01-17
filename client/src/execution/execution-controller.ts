import {
  Controller,
  Post,
} from '@nestjs/common';
import {ExecutionService} from '@/execution/execution.service';
import {
  KillExeRequest,
  killExeRequestSchema,
  LaunchExeRequest,
  launchExeRequestSchema,
} from '@/execution/execution-dto';
import {ZodBody} from '@/validation/zod-validator';

@Controller()
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
  ) {
  }

  @Post('launch-exe')
  async lunchExe(@ZodBody(launchExeRequestSchema) body: LaunchExeRequest): Promise<void> {
    await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
  }

  @Post('kill-exe')
  async killExe(@ZodBody(killExeRequestSchema) body: KillExeRequest): Promise<void> {
    await this.executionService.killExe(body.name);
  }
}
