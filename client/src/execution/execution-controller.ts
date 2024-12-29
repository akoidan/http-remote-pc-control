import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {ExecutionService} from '@/execution/execution.service';
import {RoleGuard} from '@/auth/roles.guard';
import {KillExeRequest, LaunchExeRequest} from "@/execution/execution-dto";

@Controller()
@UseGuards(RoleGuard(['execution']))
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
  ) {
  }

  @Post('launch-exe')
  async lunchExe(@Body() body: LaunchExeRequest): Promise<void> {
    await this.executionService.launchExe(body.path);
  }

  @Post('kill-exe')
  async killExe(@Body() body: KillExeRequest): Promise<void> {
    await this.executionService.killExe(body.name);
  }
}
