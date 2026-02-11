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
  @ApiOperation({summary: 'Gets window information about specified window'})
  getWindowInfo(@Param('wid', ParseIntPipe) wid: number): GetWindowResponseDto {
    return this.windowService.getWindowInfo(wid);
  }

  @Get('active')
  @ApiResponse({type: GetWindowResponseDto})
  @ApiOperation({summary: 'Gets information about active window'})
  getActiveWindowInfo(): GetWindowResponseDto {
    return this.windowService.getActiveWindowInfo();
  }

  @Patch('by-wid/:wid')
  @ApiOperation({summary: 'Set window properties'})
  setWindowProperties(
    @Param('wid', ParseIntPipe) wid: number,
    @Body() body: SetWindowPropertiesRequestDto
  ): void {
    this.windowService.setWindowProperties(wid, body);
  }

  @Post('by-wid/:wid/focus')
  @ApiOperation({summary: 'Focuses (brings to foreground) a window by its id'})
  @HttpCode(204)
  setWindowActive(@Param('wid', ParseIntPipe) wid: number): void {
    this.windowService.setWindowActive(wid);
  }
}
