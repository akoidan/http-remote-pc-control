import {
  Controller,
  Post,
} from '@nestjs/common';
import {ExecutionService} from '@/execution/execution.service';
import {
  FocusExeRequest,
  focusExeRequestSchema,
  KillExeRequest,
  killExeRequestSchema,
  LaunchExeRequest,
  launchExeRequestSchema,
  LaunchPidResponse,
} from '@/execution/execution-dto';
import {ZodBody} from '@/validation/zod-validator';
import { WindowsService } from '@/execution/windows-service';

@Controller()
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
    private readonly windowsService: WindowsService,
  ) {
  }

  @Post('launch-exe')
  async lunchExe(@ZodBody(launchExeRequestSchema) body: LaunchExeRequest): Promise<LaunchPidResponse> {
    const pid = await this.executionService.launchExe(body.path, body.arguments, body.waitTillFinish);
    return {pid};
  }

  @Post('focus-exe')
  async focusExe(@ZodBody(focusExeRequestSchema) body: FocusExeRequest): Promise<void> {
    await this.windowsService.activateWindow(body.pid);
  }

  @Post('kill-exe')
  async killExe(@ZodBody(killExeRequestSchema) body: KillExeRequest): Promise<void> {
    await this.executionService.killExe(body.name);
  }
}
