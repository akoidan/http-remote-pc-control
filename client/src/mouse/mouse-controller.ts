import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {MouseClickRequest} from '@/mouse/mouse-dto';
import {MouseService} from '@/mouse/mouse-service';

@Controller()
export class MouseController {
  constructor(
    private readonly mouseService: MouseService,
  ) {
  }

  @Post('mouse-click')
  async mouseClick(@Body() event: MouseClickRequest): Promise<void> {
    await this.mouseService.click(event.x, event.y);
  }
}
