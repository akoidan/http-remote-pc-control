import {Body, Controller, HttpCode, Post} from '@nestjs/common';
import {KeyPressRequestDto, SetKeyboardLayoutRequestDto, TypeTextRequestDto} from '@/keyboard/keyboard-dto';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {KeyboardService} from '@/keyboard/keyboard-service';

@ApiTags('Keyboard')
@Controller('keyboard')
export class KeyboardController {
  constructor(
    private readonly keyboardService: KeyboardService,
  ) {
  }

  @Post('key-press')
  @ApiOperation({summary: 'Press one or more keys'})
  @HttpCode(204)
  async keyPress(@Body() body: KeyPressRequestDto): Promise<void> {
    await this.keyboardService.keyPress(body);
  }

  @Post('type-text')
  @ApiOperation({summary: 'Type text'})
  @HttpCode(204)
  async typeText(@Body() body: TypeTextRequestDto): Promise<void> {
    await this.keyboardService.typeText(body);
  }

  @Post('set-layout')
  @ApiOperation({summary: 'Change keyboard layout'})
  @HttpCode(204)
  setLayout(@Body() body: SetKeyboardLayoutRequestDto): void {
    this.keyboardService.setLayout(body);
  }
}
