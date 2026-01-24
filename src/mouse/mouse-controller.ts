import {Body, Controller, Get, Post} from '@nestjs/common';
import {
  MouseClickRequest, MouseClickRequestDto,
  MouseMoveClickRequestDto,
  MouseMoveHumanClickRequestDto,
  MousePositionResponseDto
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
  // eslint-disable-next-line @typescript-eslint/require-await
  async getMousePosition(): Promise<MousePositionResponseDto> {
    return this.mouseService.getMousePos();
  }

  @Post('move-left-click')
  @ApiOperation({summary: 'Instantly moves mouse to the position and performs a left click there'})
  async mouseMoveClick(@Body() event: MouseMoveClickRequestDto): Promise<void> {
    await this.mouseService.mouseMove(event.x, event.y);
  }

  @Post('move')
  @ApiOperation({summary: 'Mouse move to the point, absolute coordinate for all monitors'})
  async mouseMove(@Body() event: MouseMoveClickRequestDto): Promise<void> {
    await this.mouseService.mouseMove(event.x, event.y);
  }

  @Post('move-human')
  @ApiOperation({summary: 'Moves mouse in a human pattern with time'})
  async mouseMoveHuman(@Body() event: MouseMoveHumanClickRequestDto): Promise<void> {
    await this.mouseService.moveMouseHuman(event);
  }

  @Post('click')
  @ApiOperation({summary: 'Left click on the current position'})
  async leftMouseClick(@Body() event: MouseClickRequestDto): Promise<void> {
    await this.mouseService.click(event);
  }
}
