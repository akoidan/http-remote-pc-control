import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {FocusExeRequestDto} from '@/execute/execute-dto';
import {
  IWindowService,
  WindowService,
} from '@/window/window-model';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Window')
@Controller()
export class WindowController {
  constructor(
    @Inject(WindowService)
    private readonly windowsService: IWindowService,
  ) {
  }

  @Post('focus-exe')
  @ApiOperation({summary: 'Focus window by process ID'})
  async focusExe(@Body() body: FocusExeRequestDto): Promise<void> {
    await this.windowsService.activateWindow(body.pid);
  }
}
