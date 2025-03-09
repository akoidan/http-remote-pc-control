import {
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  KeyPressRequest,
  keyPressRequestSchema,
  TypeTextRequest,
  typeTextRequestSchema,
} from '@/keyboard/keyboard-dto';
import {ZodBody, ApiZodBody} from '@/validation/zod-validator';
import {IKeyboardService, KeyboardService} from '@/keyboard/keyboard-model';

@Controller()
export class KeyboardController {
  constructor(
    @Inject(KeyboardService)
    private readonly keyboardService: IKeyboardService,
  ) {
  }

  @Post('key-press')
  @ApiZodBody(keyPressRequestSchema)
  async keyPress(@ZodBody(keyPressRequestSchema) body: KeyPressRequest): Promise<void> {
    await this.keyboardService.sendKey(body.keys as string[], body.holdKeys as string[]);
  }

  @Post('type-text')
  @ApiZodBody(typeTextRequestSchema)
  async typeText(@ZodBody(typeTextRequestSchema) body: TypeTextRequest): Promise<void> {
    await this.keyboardService.type(body.text);
  }
}
