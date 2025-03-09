import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  KillExeByNameRequest,
  killExeByNameRequestSchema,
  KillExeByPidRequest,
  killExeByPidRequestSchema,
  LaunchExeRequestClass,
  LaunchPidResponseClass,
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
  async lunchExe(@Body() body: LaunchExeRequestClass): Promise<LaunchPidResponseClass> {
    const pid = await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
    return {pid};
  }

  @Post('kill-exe-by-name')
  async killExeByName(@ZodBody(killExeByNameRequestSchema) body: KillExeByNameRequest): Promise<void> {
    await this.executionService.killExeByName(body.name);
  }

  @Post('kill-exe-by-pid')
  async killExeByPid(@ZodBody(killExeByPidRequestSchema) body: KillExeByPidRequest): Promise<void> {
    await this.executionService.killExeByPid(body.pid);
  }
}
