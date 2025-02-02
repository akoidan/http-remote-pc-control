import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {CommandProcessingService} from 'src/logic/command-processing.service';
import {
  MacroShortcutMapping,
  MacroShortcutMappingCircular,
  RandomShortcutMapping,
  ShortsData,
} from '@/config/types/shortcut';
import {CommandOrMacro} from '@/config/types/macros';
import {asyncLocalStorage} from '@/app/custom-logger';
import {Command} from '@/config/types/commands';

@Injectable()
export class ShortcutProcessingService {
  private activeFighterIndex = 0;

  constructor(
    private readonly commandProcessor: CommandProcessingService,
    private readonly logger: Logger,
  ) {
  }

  async processUnknownShortCut(comb: ShortsData): Promise<void> {
    this.logger.log(`${comb.shortCut} pressed`);

    if (Boolean((comb as RandomShortcutMapping).circular) || Boolean((comb as RandomShortcutMapping).shuffle)) {
      await this.processShortcutsWoMacro((comb as RandomShortcutMapping));
    } else if ((comb as MacroShortcutMappingCircular).threadsCircular) {
      await this.processShortcutsThreadWoMacro((comb as MacroShortcutMappingCircular));
    } else if ((comb as MacroShortcutMapping).threads) {
      await Promise.all((comb as MacroShortcutMapping).threads!.map(async(receiver, i) => new Promise((resolv, rej) => {
        const newStorageMap = new Map().set('comb', `${asyncLocalStorage.getStore()!.get('comb')}-${i + 1}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        asyncLocalStorage.run(newStorageMap, () => {
          // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
          this.processCommandWithMacro(receiver, comb.delay).then(resolv).catch(rej);
        });
      })));
    } else if ((comb as MacroShortcutMapping).commands) {
      await this.processCommandWithMacro((comb as MacroShortcutMapping).commands!, comb.delay);
    } else {
      throw Error(`Unknown shortcut ${JSON.stringify(comb)}`);
    }
  }

  private async processShortcutsWoMacro(comb: RandomShortcutMapping): Promise<void> {
    const commands: Command[] = comb.commands.flatMap(comm => this.commandProcessor.resolveAliases(comm));
    if (comb.circular && commands.length > 0) {
      await this.commandProcessor.resolveMacroAndAlias(commands[this.activeFighterIndex], false, comb.delay);
      if (this.activeFighterIndex >= commands.length - 1) {
        this.activeFighterIndex = 0;
      } else {
        this.activeFighterIndex++;
      }
    } else {
      if (comb.shuffle) {
        this.shuffle(commands);
      }
      await this.processCommandWithMacro(commands, comb.delay);
    }
  }

  private async processShortcutsThreadWoMacro(comb: MacroShortcutMappingCircular): Promise<void> {
    if (this.activeFighterIndex >= comb.threadsCircular.length - 1) {
      this.activeFighterIndex = 0;
    } else {
      this.activeFighterIndex++;
    }
    const commands: Command[] = comb.threadsCircular[this.activeFighterIndex].flatMap(comm => this.commandProcessor.resolveAliases(comm));
    for (const command of commands) {
      await this.commandProcessor.resolveMacroAndAlias(command, false, comb.delay);
    }
  }


  private async processCommandWithMacro(commands: CommandOrMacro[], combDelay: number | undefined): Promise<void> {
    for (const command of commands) {
      await this.commandProcessor.resolveMacroAndAlias(command, true, combDelay);
    }
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
