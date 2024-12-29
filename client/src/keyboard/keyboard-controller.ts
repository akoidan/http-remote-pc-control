import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {RoleGuard} from '@/auth/roles.guard';
import {KeyPressRequest, TypeTextRequest} from "@/keyboard/keyboard-dto";
import {KeyboardService} from "@/keyboard/keyboard-service";

@UseGuards(RoleGuard(['keyboard']))
@Controller()
export class KeyboardController {
  constructor(
    private readonly keyboardService: KeyboardService,
  ) {
  }

  @Post('key-press')
  async keyPress(@Body() body: KeyPressRequest): Promise<void> {
    await this.keyboardService.sendKey(body.key);
  }


  @Post('type-text')
  async typeText(@Body() body: TypeTextRequest): Promise<void> {
    await this.keyboardService.type(body.text);
  }
}
