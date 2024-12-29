import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards
} from '@nestjs/common';
import { KeyboardService } from '@/event/keyboard-service';
import {
  KeyPressRequest, KillExeRequest,
  LaunchExeRequest,
  MouseClickRequest,
  TypeTextRequest,
} from '@/event/event-dto';
import { MouseService } from '@/event/mouse-service';
import { ExecutionService } from '@/event/execution.service';
import { RoleGuard } from '@/auth/roles.guard';

@Controller()
export class EventController {
  constructor(
    private readonly keyboardService: KeyboardService,
    private readonly mouseService: MouseService,
    private readonly executionService: ExecutionService,
  ) {
  }

  @Get('ping')
  @UseGuards(RoleGuard(['reader']))
  async ping(): Promise<string> {
    return "pong"
  }

  @UseGuards(RoleGuard(['mouse']))
  @Post('mouse-click')
  async mouseClick(@Body() event: MouseClickRequest): Promise<void> {
    await this.mouseService.click(event.x, event.y);
  }

  @UseGuards(RoleGuard(['execution']))
  @Post('launch-exe')
  async lunchExe(@Body() body: LaunchExeRequest): Promise<void> {
    await this.executionService.launchExe(body.path);
  }

  @UseGuards(RoleGuard(['execution']))
  @Post('kill-exe')
  async killExe(@Body() body: KillExeRequest): Promise<void> {
    await this.executionService.killExe(body.name);
  }

  @UseGuards(RoleGuard(['keyboard']))
  @Post('key-press')
  async keyPress(@Body() body: KeyPressRequest): Promise<void> {
    await this.keyboardService.sendKey(body.key);
  }

  @UseGuards(RoleGuard(['keyboard']))
  @Post('type-text')
  async typeText(@Body() body: TypeTextRequest): Promise<void> {
    await this.keyboardService.type(body.text);
  }
}
