import {
  Controller,
  Post,
} from '@nestjs/common';
import {
  MouseClickRequest,
  mouseClickRequestSchema,
} from '@/mouse/mouse-dto';
import {MouseService} from '@/mouse/mouse-service';
import {ZodBody} from '@/validation/zod-validator';

@Controller()
export class MouseController {
  constructor(
    private readonly mouseService: MouseService,
  ) {
  }

  @Post('mouse-click')
  async mouseClick(@ZodBody(mouseClickRequestSchema) event: MouseClickRequest): Promise<void> {
    await this.mouseService.click(event.x, event.y);
  }
}
