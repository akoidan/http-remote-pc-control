import {
  Controller,
  Inject,
  Post,
  Body,
} from '@nestjs/common';
import {
  FocusExeRequest,
  FocusExeRequestDto,
} from '@/execute/execute-dto';
import {
  IWindowService,
  WindowService,
} from '@/window/window-model';
import {ApiTags, ApiOperation, ApiBody} from '@nestjs/swagger';

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
  @ApiBody({type: FocusExeRequestDto})
  async focusExe(@Body() body: FocusExeRequest): Promise<void> {
    await this.windowsService.activateWindow(body.pid);
  }
}
