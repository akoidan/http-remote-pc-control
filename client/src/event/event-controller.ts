import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards
} from '@nestjs/common';
import { KeyboardService } from '@/event/keyboard-service';
import {
  KeyPressEvent,
  LaunchExeEvent,
  MouseClickEvent,
  TypeEvent,
} from '@/event/event-dto';
import { MouseService } from '@/event/mouse-service';
import { LauncherService } from '@/event/launcher-service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller()
export class EventController {
  constructor(
    private readonly keyboardService: KeyboardService,
    private readonly mouseService: MouseService,
    private readonly launcherService: LauncherService,
  ) {
  }

  @Get('ping')
  async ping(): Promise<string> {
    return "pong"
  }

  @UseGuards(JwtAuthGuard)
  @Post('mouse-click')
  async mouseClick(@Body() event: MouseClickEvent): Promise<void> {
    await this.mouseService.click(event.x, event.y);
  }

  @Post('launch-exe')
  async lunchExe(@Body() body: LaunchExeEvent): Promise<void> {
    await this.launcherService.launchExe(body.path);
  }

  @Post('key-press')
  async keyPress(@Body() body: KeyPressEvent): Promise<void> {
    await this.keyboardService.sendKey(body.key);
  }

  @Post('type-text')
  async typeText(@Body() body: TypeEvent): Promise<void> {
    await this.keyboardService.type(body.text);
  }
}
