import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  KeyPressRequestDto,
  TypeTextRequestDto,
} from '@/keyboard/keyboard-dto';
import {
  IKeyboardService,
  KeyboardService,
} from '@/keyboard/keyboard-model';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Keyboard')
@Controller()
export class KeyboardController {
  constructor(
    @Inject(KeyboardService)
    private readonly keyboardService: IKeyboardService,
  ) {
  }

  @Post('key-press')
  @ApiOperation({summary: 'Press one or more keys'})
  async keyPress(@Body() body: KeyPressRequestDto): Promise<void> {
    await this.keyboardService.sendKey(body.keys as string[], body.holdKeys as string[]);
  }

  @Post('type-text')
  @ApiOperation({summary: 'Type text'})
  async typeText(@Body() body: TypeTextRequestDto): Promise<void> {
    await this.keyboardService.type(body.text);
  }
}
