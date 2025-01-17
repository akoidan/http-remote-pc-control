import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import {
  KeyPressRequest,
  keyPressRequestSchema,
  TypeTextRequest,
  typeTextRequestSchema,
} from '@/keyboard/keyboard-dto';
import { KeyboardService } from '@/keyboard/keyboard-service';
import { ZodBody } from '@/validation/zod-validator';

@Controller()
export class KeyboardController {
  constructor(
    private readonly keyboardService: KeyboardService,
  ) {
  }

  @Post('key-press')
  async keyPress(@ZodBody(keyPressRequestSchema) body: KeyPressRequest): Promise<void> {
    await this.keyboardService.sendKey(body.keys as string[], body.holdKeys as string[]);
  }


  @Post('type-text')
  async typeText(@ZodBody(typeTextRequestSchema) body: TypeTextRequest): Promise<void> {
    await this.keyboardService.type(body.text);
  }
}
