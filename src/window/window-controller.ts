import {Body, Controller, Get, Param, ParseIntPipe, Post} from '@nestjs/common';

import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {
  ActiveWindowIdResponse,
  ActiveWindowIdResponseDto,
  ActiveWindowResponseDto,
  FocusExeRequestDto,
  FocusWindowRequestDto,
  GetActiveWindowResponse,
  IsWindowResponse,
  IsWindowResponseDto,
  IsWindowVisibleResponse,
  IsWindowVisibleResponseDto,
  SetBoundsRequestDto,
  SetOpacityRequestDto,
  SetOwnerRequestDto,
  ShowWindowRequestDto,
  ToggleTransparencyRequestDto,
  WindowOpacityResponse,
  WindowOpacityResponseDto,
  WindowOwnerResponse,
  WindowOwnerResponseDto,
  WindowTitleResponse,
  WindowTitleResponseDto,
} from '@/window/window-dto';
import {WindowService} from '@/window/window-service';
import {WindowBounds} from '@/native/native-model';

@ApiTags('Window')
@Controller('window')
export class WindowController {
  constructor(
    private readonly windowService: WindowService,
  ) {
  }

  @Post('focus-by-pid')
  @ApiOperation({summary: 'Focus window by process ID'})
  async focusExe(@Body() body: FocusExeRequestDto): Promise<void> {
    await this.windowService.activateWindowByPid(body.pid);
  }

  @Get('by-process/:id')
  @ApiOperation({summary: 'Get all windows with their IDs for a concrete process id'})
  @ApiResponse({type: Number, isArray: true})
  async getWindowsIdByPid(@Param('id', ParseIntPipe) id: number): Promise<number[]> {
    return this.windowService.getAllWindowsByPid(id);
  }

  @Get('active-info')
  @ApiResponse({type: ActiveWindowResponseDto})
  @ApiOperation({summary: 'Get information about current active window'})
  async getActiveWindowId(): Promise<GetActiveWindowResponse> {
    return this.windowService.getActiveWindowInfo();
  }

  @Post('focus')
  @ApiOperation({summary: 'Focuses a window by its id'})
  async focusWindowId(@Body() body: FocusWindowRequestDto): Promise<void> {
    await this.windowService.focusWindowId(body.wid);
  }

  // New endpoints exposing native methods
  @Get('active-id')
  @ApiOperation({summary: 'Get active window id (raw handle)'})
  @ApiResponse({type: ActiveWindowIdResponseDto})
  getActiveWindow(): ActiveWindowIdResponse {
    return {wid: this.windowService.getActiveWindow()};
  }

  @Get(':wid/bounds')
  @ApiOperation({summary: 'Get window coordinates and parameters (x,y, width, height)'})
  getWindowBounds(@Param('wid', ParseIntPipe) wid: number): WindowBounds {
    return this.windowService.getWindowBounds(wid);
  }

  @Post('bounds')
  @ApiOperation({summary: 'Set window position and dimensions'})
  setWindowBounds(@Body() body: SetBoundsRequestDto): void {
    this.windowService.setWindowBounds(body.wid, body.bounds);
  }

  @Get(':wid/title')
  @ApiOperation({summary: 'Get window title'})
  @ApiResponse({type: WindowTitleResponseDto})
  getWindowTitle(@Param('wid', ParseIntPipe) wid: number): WindowTitleResponse {
    return {title: this.windowService.getWindowTitle(wid)};
  }

  @Post('show')
  @ApiOperation({summary: 'Show/Hide/Minimize/Restore/Maximize window'})
  showWindow(@Body() body: ShowWindowRequestDto): void {
    this.windowService.showWindow(body.wid, body.type);
  }

  @Get(':wid/opacity')
  @ApiOperation({summary: 'Get window opacity (0..1)'})
  @ApiResponse({type: WindowOpacityResponseDto})
  getWindowOpacity(@Param('wid', ParseIntPipe) wid: number): WindowOpacityResponse {
    return {opacity: this.windowService.getWindowOpacity(wid)};
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
  getWindowOwner(@Param('wid', ParseIntPipe) wid: number): WindowOwnerResponse {
    return {wid: this.windowService.getWindowOwner(wid)};
  }

  @Post('owner')
  @ApiOperation({summary: 'Set window owner handle'})
  setWindowOwner(@Body() body: SetOwnerRequestDto): void {
    this.windowService.setWindowOwner(body.wid, body.owner);
  }

  @Get(':wid/is-valid')
  @ApiOperation({summary: 'Check if handle is a window'})
  @ApiResponse({type: IsWindowResponseDto})
  isWindow(@Param('wid', ParseIntPipe) wid: number): IsWindowResponse {
    return {isValid: this.windowService.isWindow(wid)};
  }

  @Get('is-visible/:wid')
  @ApiOperation({summary: 'Check if window is visible'})
  @ApiResponse({type: IsWindowVisibleResponseDto})
  isWindowVisible(@Param('wid', ParseIntPipe) wid: number): IsWindowVisibleResponse {
    return {isVisible: this.windowService.isWindowVisible(wid)};
  }

  @Post('redraw')
  @ApiOperation({summary: 'Force window redraw'})
  redrawWindow(@Body() body: FocusWindowRequestDto): void {
    this.windowService.redrawWindow(body.wid);
  }
}
