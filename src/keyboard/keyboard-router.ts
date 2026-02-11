import {Input, Mutation, Router} from 'nestjs-trpc';
import {KeyboardService} from '@/keyboard/keyboard-service';
import {
  KeyPressRequestDto,
  keyPressRequestSchema,
  SetKeyboardLayoutRequestDto,
  setKeyboardLayoutSchema,
  TypeTextRequestDto,
  typeTextRequestSchema,
} from '@/keyboard/keyboard-dto';


@Router({alias: 'keyboard'})
export class KeyboardRouter {
  constructor(private readonly keyboardService: KeyboardService) {}

  @Mutation({input: keyPressRequestSchema})
  async keyPress(@Input() input:  KeyPressRequestDto): Promise<void> {
    await this.keyboardService.keyPress(input);
  }

  @Mutation({input: typeTextRequestSchema})
  async typeText(@Input() body: TypeTextRequestDto): Promise<void> {
    await this.keyboardService.typeText(body);
  }

  @Mutation({input: setKeyboardLayoutSchema})
  setLayout(@Input() body: SetKeyboardLayoutRequestDto): void {
    this.keyboardService.setLayout(body);
  }
}

