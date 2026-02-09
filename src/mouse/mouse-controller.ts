import {Body, Controller, Get, HttpCode, Post} from '@nestjs/common';
import {
  MouseClickRequestDto,
  MouseMoveClickRequestDto,
  MouseMoveHumanClickRequestDto,
  MousePositionResponseDto,
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
  @ApiResponse({type: MousePositionResponseDto})
  getPosition(): MousePositionResponseDto {
    return this.mouseService.getPosition();
  }

  @Post('move-left-click')
  @ApiOperation({summary: 'Instantly moves mouse to the position and performs a left click there'})
  @HttpCode(204)
  moveLeftClick(@Body() event: MouseMoveClickRequestDto): void {
    this.mouseService.moveLeftClick(event.x, event.y);
  }

  @Post('move')
  @ApiOperation({summary: 'Mouse move to the point, absolute coordinate for all monitors'})
  @HttpCode(204)
  mouseMove(@Body() event: MouseMoveClickRequestDto): void {
    this.mouseService.move(event.x, event.y);
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
  async leftMouseClick(@Body() event: MouseClickRequestDto): Promise<void> {
    await this.mouseService.click(event);
  }
}
