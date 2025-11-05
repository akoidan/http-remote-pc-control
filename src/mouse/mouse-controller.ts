import {
  Body,
  Controller, Get,
  Post,
} from '@nestjs/common';
import {MouseMoveClickRequestDto, MouseMoveHumanClickRequestDto, MousePositionResponseDto} from '@/mouse/mouse-dto';
import {MouseService} from '@/mouse/mouse-service';
import {
  ApiOperation, ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Mouse')
@Controller('mouse')
export class MouseController {
  constructor(
    private readonly mouseService: MouseService,
  ) {
  }

  @Post('mouse-move-click')
  @ApiOperation({summary: 'Click left mouse on the coordinate'})
  async mouseMoveClick(@Body() event: MouseMoveClickRequestDto): Promise<void> {
    await this.mouseService.mouseMove(event.x, event.y);
  }

  @Post('mouse-move')
  @ApiOperation({summary: 'Mouse move to the point'})
  async mouseMove(@Body() event: MouseMoveClickRequestDto): Promise<void> {
    await this.mouseService.mouseMove(event.x, event.y);
  }

  @Get('mouse-position')
  @ApiOperation({summary: 'Move mouse and click'})
  @ApiResponse({type: MousePositionResponseDto})
  // eslint-disable-next-line @typescript-eslint/require-await
  async getMousePosition(): Promise<MousePositionResponseDto> {
    return this.mouseService.getMousePos();
  }

  @Post('mouse-move-human')
  @ApiOperation({summary: 'Move mouse and click'})
  async mouseMoveHuman(@Body() event: MouseMoveHumanClickRequestDto): Promise<void> {
    await this.mouseService.moveMouseHuman(event);
  }

  @Post('left-mouse-click')
  @ApiOperation({summary: 'Left click'})
  async leftMouseClick(): Promise<void> {
    await this.mouseService.click();
  }
}
