import {Body, Controller, Get, HttpCode, Post} from '@nestjs/common';
import {
  MouseClickRequestDto,
  MousePositionRRDto,
  MouseMoveHumanClickRequestDto,
} from '@/mouse/mouse-dto';
import {MouseService} from '@/mouse/mouse-service';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';

@ApiTags('Mouse')
@Controller('mouse')
export class MouseController {
  constructor(
    private readonly mouseService: MouseService,
  ) {
  }

  @Get('position')
  @ApiOperation({summary: 'Returns X,Y of current mouse position, absolute to all monitors'})
  @ApiResponse({type: MousePositionRRDto})
  getPosition(): MousePositionRRDto {
    return this.mouseService.getPosition();
  }

  @Post('move-left-click')
  @ApiOperation({summary: 'Instantly moves mouse to the position and performs a left click there'})
  @HttpCode(204)
  moveLeftClick(@Body() event: MousePositionRRDto): void {
    this.mouseService.moveLeftClick(event);
  }

  @Post('move')
  @ApiOperation({summary: 'Mouse move to the point, absolute coordinate for all monitors'})
  @HttpCode(204)
  setMousePosition(@Body() event: MousePositionRRDto): void {
    this.mouseService.move(event);
  }

  @Post('move-human')
  @ApiOperation({summary: 'Moves mouse in a human pattern with time'})
  @HttpCode(204)
  async mouseMoveHuman(@Body() event: MouseMoveHumanClickRequestDto): Promise<void> {
    await this.mouseService.moveMouseHuman(event);
  }

  @Post('click')
  @ApiOperation({summary: 'Left click on the current position'})
  @HttpCode(204)
  leftMouseClick(@Body() event: MouseClickRequestDto): void {
    this.mouseService.click(event);
  }
}
