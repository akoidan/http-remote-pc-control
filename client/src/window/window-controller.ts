import {
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  FocusExeRequest,
  focusExeRequestSchema,
} from '@/execute/execute-dto';
import {ZodBody} from '@/validation/zod-validator';
import {
  IWindowService,
  WindowService,
} from '@/window/window-model';

@Controller()
export class WindowController {
  constructor(
    @Inject(WindowService)
    private readonly windowsService: IWindowService,
  ) {
  }

  @Post('focus-exe')
  async focusExe(@ZodBody(focusExeRequestSchema) body: FocusExeRequest): Promise<void> {
    await this.windowsService.activateWindow(body.pid);
  }
}
