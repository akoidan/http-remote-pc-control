import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {CommandProcessingService} from 'src/logic/command-processing.service';
import {
  MacroShortcutMapping,
  RandomShortcutMapping,
  ShortsData,
} from '@/config/types/shortcut';
import {CommandOrMacro} from '@/config/types/macros';

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

    if (this.isRandomMapping(comb)) {
      await this.processShortcutsWoMacro(comb);
    } else if (this.isMacroMapping(comb)) {
      if (comb.threads) {
        await Promise.all(comb.threads.map(async receiver => {
          await this.processCommandWithMacro(receiver, comb.delay);
        }));
      } else if (comb.commands) {
        await this.processCommandWithMacro(comb.commands, comb.delay);
      }
    }
  }

  private async processShortcutsWoMacro(comb: RandomShortcutMapping): Promise<void> {
    const commands = comb.commands.flatMap(comm => this.commandProcessor.resolveAliases(comm));
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


  private async processCommandWithMacro(commands: CommandOrMacro[], combDelay: number|undefined): Promise<void> {
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

  private isRandomMapping(shortcut: ShortsData): shortcut is RandomShortcutMapping {
    return Boolean((shortcut as RandomShortcutMapping).circular) || Boolean((shortcut as RandomShortcutMapping).shuffle);
  }

  private isMacroMapping(shortcut: ShortsData): shortcut is MacroShortcutMapping {
    return Boolean((shortcut as MacroShortcutMapping).commands) || Boolean((shortcut as MacroShortcutMapping).threads);
  }
}
