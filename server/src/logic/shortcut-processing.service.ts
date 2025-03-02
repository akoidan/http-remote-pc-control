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
import clc from 'cli-color';

@Injectable()
export class ShortcutProcessingService {
  private activeFighterIndex: Record<string, number> = {};
  private iterationsInProgress: Record<string, boolean> = {};

  constructor(
    private readonly commandProcessor: CommandProcessingService,
    private readonly logger: Logger,
  ) {
  }

  async processUnknownShortCut(comb: ShortsData): Promise<void> {
    if (typeof comb.iterations !== 'undefined') {
      await this.processLoop(comb);
    } else if (Boolean((comb as RandomShortcutMapping).circular) || Boolean((comb as RandomShortcutMapping).shuffle)) {
      await this.processShortcutsWoMacro((comb as RandomShortcutMapping));
    } else if ((comb as MacroShortcutMappingCircular).threadsCircular) {
      await this.processShortcutsThreadWoMacro((comb as MacroShortcutMappingCircular));
    } else if ((comb as MacroShortcutMapping).threads) {
      await Promise.all((comb as MacroShortcutMapping).threads!.map(async(receiver, i) => new Promise((resolv, rej) => {
        const newStorageMap = new Map().set('comb', `${asyncLocalStorage.getStore()!.get('comb')}-${i + 1}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        asyncLocalStorage.run(newStorageMap, () => {
          // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
          this.processCommandWithMacro(receiver, comb.delayAfter, comb.delayBefore).then(resolv).catch(rej);
        });
      })));
    } else if ((comb as MacroShortcutMapping).commands) {
      await this.processCommandWithMacro((comb as MacroShortcutMapping).commands!, comb.delayAfter, comb.delayBefore);
    } else {
      throw Error(`Unknown shortcut ${JSON.stringify(comb)}`);
    }
  }

  private async processLoop(comb: ShortsData) {
    if (this.iterationsInProgress[comb.shortCut]) {
      this.iterationsInProgress[comb.shortCut] = false;
      this.logger.log(`Halting ${clc.bold.green(comb.name)}. Waiting for its command to finish...`)
    } else {
      this.iterationsInProgress[comb.shortCut] = true;
      const copy: ShortsData = JSON.parse(JSON.stringify(comb));
      delete copy['iterations'];
      for (let i = 1; this.iterationsInProgress[comb.shortCut]; i++) {
        if (comb.iterations! > 0 && comb.iterations! < i) {
          break
        }
        this.logger.log(`Running ${clc.yellow(i)} iteration of ${clc.bold.green(comb.name)}`)
        await this.processUnknownShortCut(copy);
      }
    }
  }

  private async processShortcutsWoMacro(comb: RandomShortcutMapping): Promise<void> {
    const commands: Command[] = comb.commands.flatMap(comm => this.commandProcessor.resolveAliases(comm));
    if (comb.circular && commands.length > 0) {
      const command = this.getNextFighterIndex(comb.shortCut, commands);
      await this.commandProcessor.resolveMacroAndAlias(command, false, comb.delayAfter, comb.delayBefore);
    } else {
      if (comb.shuffle) {
        this.shuffle(commands);
      }
      await this.processCommandWithMacro(commands, comb.delayAfter, comb.delayBefore);
    }
  }

  getNextFighterIndex<T>(key: string, commands: T[]): T {
    // if not initialized, or index out of bounds
    if (commands.length === 0) {
      throw Error(`No commands found for ${key}`);
    }
    if (typeof this.activeFighterIndex[key] === 'undefined') {
      this.activeFighterIndex[key] = 0;
    } else {
      this.activeFighterIndex[key]++;
    }
    if (this.activeFighterIndex[key] >= commands.length) {
      this.activeFighterIndex[key] = 0;
    }
    return commands[this.activeFighterIndex[key]];
  }

  private async processShortcutsThreadWoMacro(comb: MacroShortcutMappingCircular): Promise<void> {
    const thread = this.getNextFighterIndex(comb.shortCut, comb.threadsCircular);
    const commands: Command[] = thread.flatMap(comm => this.commandProcessor.resolveAliases(comm));
    for (const command of commands) {
      await this.commandProcessor.resolveMacroAndAlias(command, false, comb.delayAfter, comb.delayBefore);
    }
  }


  private async processCommandWithMacro(
    commands: CommandOrMacro[],
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined
  ): Promise<void> {
    for (const command of commands) {
      await this.commandProcessor.resolveMacroAndAlias(command, true, combDelayAfter, combDelayBefore);
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
