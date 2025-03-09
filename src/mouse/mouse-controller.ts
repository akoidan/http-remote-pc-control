import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import {
  MouseMoveClickRequest,
  MouseMoveClickRequestDto,
} from '@/mouse/mouse-dto';
import {MouseService} from '@/mouse/mouse-service';
import {ApiTags, ApiOperation, ApiBody} from '@nestjs/swagger';

@ApiTags('Mouse')
@Controller()
export class MouseController {
  constructor(
    private readonly mouseService: MouseService,
  ) {
  }

  @Post('mouse-move-click')
  @ApiOperation({summary: 'Move mouse and click'})
  @ApiBody({type: MouseMoveClickRequestDto})
  async mouseMoveClick(@Body() event: MouseMoveClickRequest): Promise<void> {
    await this.mouseService.leftMouseMoveClick(event.x, event.y);
  }

  @Post('left-mouse-click')
  @ApiOperation({summary: 'Left click'})
  async leftMouseClick(): Promise<void> {
    await this.mouseService.click();
  }
}
