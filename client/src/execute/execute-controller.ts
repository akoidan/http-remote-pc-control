import {
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  KillExeRequest,
  killExeRequestSchema,
  LaunchExeRequest,
  launchExeRequestSchema,
  LaunchPidResponse,
} from '@/execute/execute-dto';
import {ZodBody} from '@/validation/zod-validator';
import {
  ExecuteService,
  IExecuteService,
} from '@/execute/execute-model';

@Controller()
export class ExecuteController {
  constructor(
    @Inject(ExecuteService)
    private readonly executionService: IExecuteService,
  ) {
  }

  @Post('launch-exe')
  async lunchExe(@ZodBody(launchExeRequestSchema) body: LaunchExeRequest): Promise<LaunchPidResponse> {
    const pid = await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
    return {pid};
  }

  @Post('kill-exe')
  async killExe(@ZodBody(killExeRequestSchema) body: KillExeRequest): Promise<void> {
    await this.executionService.killExe(body.name);
  }
}
