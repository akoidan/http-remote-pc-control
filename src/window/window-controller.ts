import {Body, Controller, Get, Param, ParseIntPipe, Post} from '@nestjs/common';

import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {
  ActiveWindowResponseDto,
  ActiveWindowIdResponseDto,
  WindowTitleResponseDto,
  WindowOpacityResponseDto,
  WindowOwnerResponseDto,
  FocusExeRequestDto,
  FocusWindowRequestDto,
  GetActiveWindowResponse,
  GetPidWindowsResponse,
  SetBoundsRequestDto,
  SetOpacityRequestDto,
  SetOwnerRequestDto,
  ShowWindowRequestDto,
  ToggleTransparencyRequestDto,
  WindowsIdsResponseDto,
  WindowVisibleResponseDto,
} from '@/window/window-dto';
import {WindowService} from '@/window/window-service';
import {MonitorBounds} from '@/native/native-model';

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
    return {wids};
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
  @ApiResponse({type: ActiveWindowIdResponseDto})
  getActiveWindow(): { wid: number } {
    return { wid: this.windowService.getActiveWindow() };
  }

  @Get(':wid/bounds')
  @ApiOperation({summary: 'Get window bounds'})
  getWindowBounds(@Param('wid', ParseIntPipe) wid: number): MonitorBounds {
    return this.windowService.getWindowBounds(wid);
  }

  @Post('bounds')
  @ApiOperation({summary: 'Set window bounds'})
  setWindowBounds(@Body() body: SetBoundsRequestDto): void {
    this.windowService.setWindowBounds(body.wid, body.bounds);
  }

  @Get(':wid/title')
  @ApiOperation({summary: 'Get window title'})
  @ApiResponse({type: WindowTitleResponseDto})
  getWindowTitle(@Param('wid', ParseIntPipe) wid: number): { title: string } {
    return { title: this.windowService.getWindowTitle(wid) };
  }

  @Post('show')
  @ApiOperation({summary: 'Show/Hide/Minimize/Restore/Maximize window'})
  showWindow(@Body() body: ShowWindowRequestDto): void {
    this.windowService.showWindow(body.wid, body.type);
  }

  @Get(':wid/opacity')
  @ApiOperation({summary: 'Get window opacity (0..1)'})
  @ApiResponse({type: WindowOpacityResponseDto})
  getWindowOpacity(@Param('wid', ParseIntPipe) wid: number): { opacity: number } {
    return { opacity: this.windowService.getWindowOpacity(wid) };
  }

  @Post('opacity')
  @ApiOperation({summary: 'Set window opacity (0..1)'})
  setWindowOpacity(@Body() body: SetOpacityRequestDto): void {
    this.windowService.setWindowOpacity(body.wid, body.opacity);
  }

  @Post('transparency')
  @ApiOperation({summary: 'Toggle window WS_EX_LAYERED transparency flag'})
  toggleTransparency(@Body() body: ToggleTransparencyRequestDto): void {
    this.windowService.toggleWindowTransparency(body.wid, body.toggle);
  }

  @Get(':wid/owner')
  @ApiOperation({summary: 'Get window owner handle'})
  @ApiResponse({type: WindowOwnerResponseDto})
  getWindowOwner(@Param('wid', ParseIntPipe) wid: number): { owner: number } {
    return { owner: this.windowService.getWindowOwner(wid) };
  }

  @Post('owner')
  @ApiOperation({summary: 'Set window owner handle'})
  setWindowOwner(@Body() body: SetOwnerRequestDto): void {
    this.windowService.setWindowOwner(body.wid, body.owner);
  }

  @Get(':wid/is-window')
  @ApiOperation({summary: 'Check if handle is a window'})
  isWindow(@Param('wid', ParseIntPipe) wid: number): boolean {
    return this.windowService.isWindow(wid);
  }

  @Get(':wid/is-visible')
  @ApiOperation({summary: 'Check if window is visible'})
  @ApiResponse({type: WindowVisibleResponseDto})
  isWindowVisible(@Param('wid', ParseIntPipe) wid: number): { visible: boolean } {
    return { visible: this.windowService.isWindowVisible(wid) };
  }

  @Post('redraw')
  @ApiOperation({summary: 'Force window redraw'})
  redrawWindow(@Body() body: FocusWindowRequestDto): void {
    this.windowService.redrawWindow(body.wid);
  }
}
