import {
  Controller,
  Inject,
  Post,
  Body,
} from '@nestjs/common';
import {
  KeyPressRequest,
  TypeTextRequest,
  KeyPressRequestDto,
  TypeTextRequestDto,
} from '@/keyboard/keyboard-dto';
import {IKeyboardService, KeyboardService} from '@/keyboard/keyboard-model';
import {ApiTags, ApiOperation, ApiBody} from '@nestjs/swagger';

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
  @ApiBody({type: KeyPressRequestDto})
  async keyPress(@Body() body: KeyPressRequest): Promise<void> {
    await this.keyboardService.sendKey(body.keys as string[], body.holdKeys as string[]);
  }

  @Post('type-text')
  @ApiOperation({summary: 'Type text'})
  @ApiBody({type: TypeTextRequestDto})
  async typeText(@Body() body: TypeTextRequest): Promise<void> {
    await this.keyboardService.type(body.text);
  }
}
