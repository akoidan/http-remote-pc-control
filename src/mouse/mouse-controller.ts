import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import {MouseMoveClickRequestDto} from '@/mouse/mouse-dto';
import {MouseService} from '@/mouse/mouse-service';
import {
  ApiBody,
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
  @ApiBody({ type: MouseMoveClickRequestDto })
  async mouseMoveClick(@Body() event: MouseMoveClickRequestDto): Promise<void> {
    await this.mouseService.leftMouseMoveClick(event.x, event.y);
  }

  @Post('left-mouse-click')
  @ApiOperation({summary: 'Left click'})
  async leftMouseClick(): Promise<void> {
    await this.mouseService.click();
  }
}
