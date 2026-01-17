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
  WindowOwnerResponseDto, WindowResponse, WindowResponseDto,
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

  @Post(':wid/focus')
  @ApiOperation({summary: 'Focuses a window by its id'})
  async focusWindowId(@Body() body: FocusWindowRequestDto): Promise<void> {
    await this.windowService.focusWindowId(body.wid);
  }

  @Post(':wid/bounds')
  @ApiOperation({summary: 'Set window position and dimensions'})
  setWindowBounds(@Body() body: SetBoundsRequestDto): void {
    this.windowService.setWindowBounds(body.wid, body.bounds);
  }

  @Post(':wid/show')
  @ApiOperation({summary: 'Show/Hide/Minimize/Restore/Maximize window'})
  showWindow(@Body() body: ShowWindowRequestDto): void {
    this.windowService.showWindow(body.wid, body.type);
  }

  @Post(':wid/opacity')
  @ApiOperation({summary: 'Set window opacity (0..1)'})
  setWindowOpacity(@Body() body: SetOpacityRequestDto): void {
    this.windowService.setWindowOpacity(body.wid, body.opacity);
  }

  @Post(':wid/transparency')
  @ApiOperation({summary: 'Toggle window WS_EX_LAYERED transparency flag'})
  toggleTransparency(@Body() body: ToggleTransparencyRequestDto): void {
    this.windowService.toggleWindowTransparency(body.wid, body.toggle);
  }

  @Post(':wid/owner')
  @ApiOperation({summary: 'Set window owner handle'})
  setWindowOwner(@Body() body: SetOwnerRequestDto): void {
    this.windowService.setWindowOwner(body.wid, body.owner);
  }

  @Post(':wid/redraw')
  @ApiOperation({summary: 'Force window redraw'})
  redrawWindow(@Body() body: FocusWindowRequestDto): void {
    this.windowService.redrawWindow(body.wid);
  }
}
