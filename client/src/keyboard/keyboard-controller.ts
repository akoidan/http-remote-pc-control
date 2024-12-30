import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import {
  KeyPressRequest,
  TypeTextRequest,
} from '@/keyboard/keyboard-dto';
import {KeyboardService} from '@/keyboard/keyboard-service';

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
