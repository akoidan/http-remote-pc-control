import {
  Body,
  Controller, Get, Param, ParseIntPipe,
  Post,
} from '@nestjs/common';

import {
  ApiOperation, ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  FocusExeRequestDto,
  FocusWindowRequestDto,
  GetPidWindowsResponse,
  WindowsIdsResponseDto,
} from '@/window/window-dto';
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
    await this.windowService.activateWindowByPid(body.pid);
  }

  @Get('get-process-windows/:id')
  @ApiResponse({type: WindowsIdsResponseDto})
  @ApiOperation({summary: 'Get all windows with their IDs for a concrete process id'})
  async getWindowsIdByPid(@Param('id', ParseIntPipe) id: number): Promise<GetPidWindowsResponse> {
    const ids = await this.windowService.getAllWindowsByPid(id);
    return {
      ids,
    };
  }

  @Post('focus-window')
  @ApiOperation({summary: 'Focuses a window by its id'})
  async focusWindowId(@Body() body: FocusWindowRequestDto): Promise<void> {
    await this.windowService.focusWindowId(body.wid);
  }
}
