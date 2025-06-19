import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {FocusExeRequestDto} from '@/window/window-dto';
import {WindowService} from '@/window/window-service';

@ApiTags('Window')
@Controller()
export class WindowController {
  constructor(
    private readonly windowService: WindowService,
  ) {
  }

  @Post('focus-exe')
  @ApiOperation({summary: 'Focus window by process ID'})
  async focusExe(@Body() body: FocusExeRequestDto): Promise<void> {
    await this.windowService.activateWindow(body.pid);
  }
}
