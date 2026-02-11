import {Mutation, Router} from 'nestjs-trpc';
import {z} from 'zod';
import {KeyboardService} from '@/keyboard/keyboard-service';
import {KeyPressRequestDto, keyPressRequestSchema} from '@/keyboard/keyboard-dto';


@Router({alias: 'keyboard'})
export class KeyboardRouter {
  constructor(private readonly keyboardService: KeyboardService) {}

  @Mutation({output: z.null(), input: keyPressRequestSchema})
  async keyPress(input: KeyPressRequestDto): Promise<void> {
    await this.keyboardService.keyPress(input);
  }
}

