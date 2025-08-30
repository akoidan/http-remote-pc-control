import {Body, Controller, Get, Param, ParseIntPipe, Post} from '@nestjs/common';

import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {
  ActiveWindowResponseDto,
  FocusExeRequestDto,
  FocusWindowRequestDto,
  GetActiveWindowResponse,
  GetPidWindowsResponse,
  WindowsIdsResponseDto,
  SetBoundsRequestDto,
  ShowWindowRequestDto,
  SetOpacityRequestDto,
  ToggleTransparencyRequestDto,
  SetOwnerRequestDto,
} from '@/window/window-dto';
import {WindowService} from '@/window/window-service';

@ApiTags('Window')
@Controller('window')
export class WindowController {
  constructor(
    private readonly windowService: WindowService,
  ) {}

  @Post('focus-exe')
  @ApiOperation({summary: 'Focus window by process ID'})
  async focusExe(@Body() body: FocusExeRequestDto): Promise<void> {
    await this.windowService.activateWindowByPid(body.pid);
  }

  @Get('get-process-windows/:id')
  @ApiResponse({type: WindowsIdsResponseDto})
  @ApiOperation({summary: 'Get all windows with their IDs for a concrete process id'})
  async getWindowsIdByPid(@Param('id', ParseIntPipe) id: number): Promise<GetPidWindowsResponse> {
    const wids = await this.windowService.getAllWindowsByPid(id);
    return { wids };
  }

  @Get('get-active-window')
  @ApiResponse({type: ActiveWindowResponseDto})
  @ApiOperation({summary: 'Get information about current active window'})
  async getActiveWindowId(): Promise<GetActiveWindowResponse> {
    return this.windowService.getActiveWindowInfo();
  }

  @Post('focus-window')
  @ApiOperation({summary: 'Focuses a window by its id'})
  async focusWindowId(@Body() body: FocusWindowRequestDto): Promise<void> {
    await this.windowService.focusWindowId(body.wid);
  }

  // New endpoints exposing native methods
  @Get('active-window-id')
  @ApiOperation({summary: 'Get active window id (raw handle)'})
  async getActiveWindow(): Promise<number> {
    return this.windowService.getActiveWindow();
  }

  @Get(':wid/bounds')
  @ApiOperation({summary: 'Get window bounds'})
  async getWindowBounds(@Param('wid', ParseIntPipe) wid: number) {
    return this.windowService.getWindowBounds(wid);
  }

  @Post('bounds')
  @ApiOperation({summary: 'Set window bounds'})
  async setWindowBounds(@Body() body: SetBoundsRequestDto): Promise<boolean> {
    return this.windowService.setWindowBounds(body.wid, body.bounds);
  }

  @Get(':wid/title')
  @ApiOperation({summary: 'Get window title'})
  async getWindowTitle(@Param('wid', ParseIntPipe) wid: number): Promise<string> {
    return this.windowService.getWindowTitle(wid);
  }

  @Post('show')
  @ApiOperation({summary: 'Show/Hide/Minimize/Restore/Maximize window'})
  async showWindow(@Body() body: ShowWindowRequestDto): Promise<boolean> {
    return this.windowService.showWindow(body.wid, body.type);
  }

  @Get(':wid/opacity')
  @ApiOperation({summary: 'Get window opacity (0..1)'})
  async getWindowOpacity(@Param('wid', ParseIntPipe) wid: number): Promise<number> {
    return this.windowService.getWindowOpacity(wid);
  }

  @Post('opacity')
  @ApiOperation({summary: 'Set window opacity (0..1)'})
  async setWindowOpacity(@Body() body: SetOpacityRequestDto): Promise<boolean> {
    return this.windowService.setWindowOpacity(body.wid, body.opacity);
  }

  @Post('transparency')
  @ApiOperation({summary: 'Toggle window WS_EX_LAYERED transparency flag'})
  async toggleTransparency(@Body() body: ToggleTransparencyRequestDto): Promise<boolean> {
    return this.windowService.toggleWindowTransparency(body.wid, body.toggle);
  }

  @Get(':wid/owner')
  @ApiOperation({summary: 'Get window owner handle'})
  async getWindowOwner(@Param('wid', ParseIntPipe) wid: number): Promise<number> {
    return this.windowService.getWindowOwner(wid);
  }

  @Post('owner')
  @ApiOperation({summary: 'Set window owner handle'})
  async setWindowOwner(@Body() body: SetOwnerRequestDto): Promise<boolean> {
    return this.windowService.setWindowOwner(body.wid, body.owner);
  }

  @Get(':wid/is-window')
  @ApiOperation({summary: 'Check if handle is a window'})
  async isWindow(@Param('wid', ParseIntPipe) wid: number): Promise<boolean> {
    return this.windowService.isWindow(wid);
  }

  @Get(':wid/is-visible')
  @ApiOperation({summary: 'Check if window is visible'})
  async isWindowVisible(@Param('wid', ParseIntPipe) wid: number): Promise<boolean> {
    return this.windowService.isWindowVisible(wid);
  }

  @Post('redraw')
  @ApiOperation({summary: 'Force window redraw'})
  async redrawWindow(@Body() body: FocusWindowRequestDto): Promise<boolean> {
    return this.windowService.redrawWindow(body.wid);
  }

}
