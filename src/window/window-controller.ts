import {Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post} from '@nestjs/common';

import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {SetWindowPropertiesRequestDto, GetWindowResponseDto} from '@/window/window-dto';
import {WindowService} from '@/window/window-service';

@ApiTags('Window')
@Controller('window')
export class WindowController {
  constructor(
    private readonly windowService: WindowService,
  ) {
  }

  @Get(':wid')
  @ApiResponse({type: GetWindowResponseDto})
  @ApiOperation({summary: 'Get window coordinates and parameters (x,y, width, height)'})
  getWindowBounds(@Param('wid', ParseIntPipe) wid: number): GetWindowResponseDto {
    return this.windowService.getWindowInfo(wid);
  }

  @Get('active')
  @ApiResponse({type: GetWindowResponseDto})
  @ApiOperation({summary: 'Get information about current active window'})
  async getWindowActiveId(): Promise<GetWindowResponseDto> {
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
    await this.windowService.setWindowActive(wid);
  }
}
