import {Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post} from '@nestjs/common';

import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {GetWindowResponseDto, SetWindowPropertiesRequestDto} from '@/window/window-dto';
import {WindowService} from '@/window/window-service';

@ApiTags('Window')
@Controller('window')
export class WindowController {
  constructor(
    private readonly windowService: WindowService,
  ) {
  }

  @Get('by-wid/:wid')
  @ApiResponse({type: GetWindowResponseDto})
  @ApiOperation({summary: 'Get window coordinates and parameters (x,y, width, height)'})
  getWindowBounds(@Param('wid', ParseIntPipe) wid: number): GetWindowResponseDto {
    return this.windowService.getWindowInfo(wid);
  }

  @Get('active')
  @ApiResponse({type: GetWindowResponseDto})
  @ApiOperation({summary: 'Get information about current active window'})
  getWindowActiveId(): GetWindowResponseDto {
    return this.windowService.getActiveWindowInfo();
  }

  @Patch('by-wid/:wid')
  @ApiOperation({summary: 'Set window properties'})
  setWindowBounds(
    @Param('wid', ParseIntPipe) wid: number,
    @Body() body: SetWindowPropertiesRequestDto
  ): void {
    this.windowService.setWindowProperties(wid, body);
  }

  @Post('by-wid/:wid/focus')
  @ApiOperation({summary: 'Focuses a window by its id'})
  @HttpCode(204)
  focusWindowId(@Param('wid', ParseIntPipe) wid: number): void {
    this.windowService.setWindowActive(wid);
  }
}
