import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  INativeModule,
  ModifierKey,
  Native
} from '@/native/native-model';

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
    const ret = this.native.registerHotkey(key, modifiers, cb);
    this.logger.debug(`registering ${shortCut} shortcut`);
    // if (!ret) {
    //   throw Error(`Cannot bind ${shortCut} shortcut`);
    // }
  }
}
