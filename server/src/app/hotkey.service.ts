import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  INativeModule,
  ModifierKey,
  Native,
} from '@/native/native-model';
import clc from 'cli-color';

@Injectable()
export class HotkeyService {
  constructor(
      private readonly logger: Logger,
      @Inject(Native)
      private readonly native: INativeModule
  ) {
  }

  unregister(): void {
    this.native.cleanupHotkeys();
  }

  registerShortcut(shortCut: string, cb: () => void): void {
    const modifiers: ModifierKey[] = shortCut.split('+').map(a => a.toLowerCase()) as ModifierKey[];
    const key = modifiers.pop() as string;
    this.logger.debug(`registering ${clc.bold.green(shortCut)} shortcut`);
    try {
      this.native.registerHotkey(key, modifiers, cb);
    } catch (e) {
      throw new Error(`Unable to register ${shortCut} becase ${e.message}`);
    }
  }
}
