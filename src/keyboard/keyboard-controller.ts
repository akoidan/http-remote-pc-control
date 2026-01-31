import {Body, Controller, Post} from '@nestjs/common';
import {KeyPressRequestDto, SetKeyboardLayoutRequestDto, TypeTextRequestDto} from '@/keyboard/keyboard-dto';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {KeyboardService} from "@/keyboard/keyboard-service";

@ApiTags('Keyboard')
@Controller('keyboard')
export class KeyboardController {
  constructor(
    private readonly keyboardService: KeyboardService,
  ) {
  }

  @Post('key-press')
  @ApiOperation({summary: 'Press one or more keys'})
  async keyPress(@Body() body: KeyPressRequestDto): Promise<void> {
    await this.keyboardService.keyPress(body.keys as string[], body.holdKeys as string[], body.duration);
  }

  @Post('type-text')
  @ApiOperation({summary: 'Type text'})
  async typeText(@Body() body: TypeTextRequestDto): Promise<void> {
    await this.keyboardService.typeText(body.text, body.keyDelay, body.keyDelayDeviation);
  }

  @Post('set-layout')
  @ApiOperation({summary: 'Change keyboard layout'})
  setKeyboardLayout(@Body() body: SetKeyboardLayoutRequestDto): void {
    this.keyboardService.setLayout(body.layout);
  }
}
