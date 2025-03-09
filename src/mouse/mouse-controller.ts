import {
  Controller,
  Post,
} from '@nestjs/common';
import {
  MouseMoveClickRequest,
  mouseMoveClickRequestSchema,
} from '@/mouse/mouse-dto';
import {MouseService} from '@/mouse/mouse-service';
import {ZodBody} from '@/validation/zod-validator';

@Controller()
export class MouseController {
  constructor(
    private readonly mouseService: MouseService,
  ) {
  }

  @Post('mouse-move-click')
  async mouseMoveClick(@ZodBody(mouseMoveClickRequestSchema) event: MouseMoveClickRequest): Promise<void> {
    await this.mouseService.leftMouseMoveClick(event.x, event.y);
  }

  @Post('left-mouse-click')
  async leftMouseClick(): Promise<void> {
    await this.mouseService.click();
  }
}
