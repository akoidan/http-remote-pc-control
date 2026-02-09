import {Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post} from '@nestjs/common';

import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {SetWindowPropertiesRequestDto, WindowResponseDto} from '@/window/window-dto';
import {WindowService} from '@/window/window-service';

@ApiTags('Window')
@Controller('window')
export class WindowController {
  constructor(
    private readonly windowService: WindowService,
  ) {
  }

  @Get(':wid')
  @ApiResponse({type: WindowResponseDto})
  @ApiOperation({summary: 'Get window coordinates and parameters (x,y, width, height)'})
  getWindowBounds(@Param('wid', ParseIntPipe) wid: number): WindowResponseDto {
    return this.windowService.getWindowInfo(wid);
  }

  @Get('active')
  @ApiResponse({type: WindowResponseDto})
  @ApiOperation({summary: 'Get information about current active window'})
  async getActiveWindowId(): Promise<WindowResponseDto> {
    return this.windowService.getActiveWindowInfo();
  }

  @Patch(':wid')
  @ApiOperation({summary: 'Set window properties'})
  setWindowBounds(
    @Param('wid', ParseIntPipe) wid: number,
    @Body() body: SetWindowPropertiesRequestDto
  ): void {
    this.windowService.setWindowState(wid, body);
  }

  @Post(':wid/focus')
  @ApiOperation({summary: 'Focuses a window by its id'})
  @HttpCode(204)
  async focusWindowId(@Param('wid', ParseIntPipe) wid: number): Promise<void> {
    await this.windowService.focusWindowId(wid);
  }

  @Post(':wid/redraw')
  @ApiOperation({summary: 'Force window redraw'})
  @HttpCode(204)
  redrawWindow(@Param('wid', ParseIntPipe) wid: number): void {
    this.windowService.redrawWindow(wid);
  }
}
