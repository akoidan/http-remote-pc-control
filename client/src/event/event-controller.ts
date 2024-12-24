import {
  Body,
  Controller,
  Get,
  Post
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

  @Post('mouse-click')
  async mouseClick(@Body() body: MouseClickEvent): Promise<void> {
    await this.mouseService.click(body.x, body.y);
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
