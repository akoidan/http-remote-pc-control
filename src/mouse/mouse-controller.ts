import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import {MouseMoveClickRequestDto, MouseMoveHumanClickRequestDto} from '@/mouse/mouse-dto';
import {MouseService} from '@/mouse/mouse-service';
import {
  ApiOperation,
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
  @ApiOperation({summary: 'Move mouse and click'})
  async mouseMoveClick(@Body() event: MouseMoveClickRequestDto): Promise<void> {
    await this.mouseService.leftMouseMoveClick(event.x, event.y);
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
