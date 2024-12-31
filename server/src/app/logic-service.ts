/* eslint-disable max-lines */
import {
  ExecuteCommand,
  MacroCommand,
  BaseCommand,
  MouseClickCommand,
  KeyPressCommand,
  TypeTextCommand,
  Command,
  CommandOrMacro,
  KillCommand,
  Key,
} from '@/config/types/commands';
import {
  EventData,
} from '@/config/types/schema';
import {ConfigService} from '@/config/config-service';
import {ClientService} from '@/client/client-service';
import {
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class LogicService {
  constructor(
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly logger: Logger,
  ) {
  }

  private activeFighterIndex = 0;

  async pingClients(): Promise<unknown[]> {
    this.logger.debug('Pinging clients...');
    return Promise.all(
      Object.entries(this.configService.getIps())
        .map(async([_, ip]) => this.clientService.ping(ip))
    );
  }

  async runCommand(currRec: Command): Promise<void> {
    const ip = this.configService.getIps()[(currRec as BaseCommand).destination];
    if ((currRec as KeyPressCommand).keySend) {
      await this.clientService.keyPress(ip, {key: (currRec as KeyPressCommand).keySend as Key});
    } else if ((currRec as MouseClickCommand).mouseMoveX) {
      await this.clientService.mouseClick(ip, {
        x: (currRec as MouseClickCommand).mouseMoveX as number,
        y: (currRec as MouseClickCommand).mouseMoveY as number,
      });
    } else if ((currRec as ExecuteCommand).launch) {
      await this.clientService.launchExe(ip, {
        path: (currRec as ExecuteCommand).launch,
        arguments: (currRec as ExecuteCommand).arguments ?? [],
      });
    } else if ((currRec as TypeTextCommand).typeText) {
      await this.clientService.typeText(ip, {
        text: (currRec as TypeTextCommand).typeText,
      });
    }  else if ((currRec as KillCommand).kill) {
      await this.clientService.killExe(ip, {
        name: (currRec as KillCommand).kill,
      });
    } else {
      throw Error(`Unknown receiver type ${JSON.stringify(currRec)}`);
    }
  }

  replacePlaceholders<T extends object>(obj: T, variables: Record<string, unknown> | undefined): T {
    if (!variables) {
      return obj;
    }
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      result[key] = value;
      for (const varName in variables) {
        if (value === `{{${varName}}}`) {
          result[key] = variables[varName] as T[keyof T];
        }
      }
    }
    return result as T;
  }

    replaceGlobalVars<T extends object>(obj: T): T {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const globalVars = this.configService.getGlobalVars();
        const varName = value.slice(2, -2);
        if (globalVars[varName]) {
          result[key] = globalVars[varName] as T[keyof T];
        } else {
          throw Error(`Unknown environment variable ${value}`);
        }
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  async processEvent(comb: EventData): Promise<void> {
    this.logger.log(`${comb.shortCut} pressed`);
    if (comb.commands) {
      await this.processReceiverEvent(comb, comb.commands);
    } else if (comb.threads) {
      this.logger.log(`${comb.shortCut} processing ${comb.threads.length} in parallel`);
      await Promise.all(comb.threads.map(async receiver => this.processReceiverEvent(comb, receiver)));
    } else {
      throw Error('Unknown event type');
    }
  }

  private async processReceiverEvent(
    comb: Omit<EventData, 'threads' | 'commands'>,
    inputReceivers: CommandOrMacro[]
  ): Promise<void> {
    const commands = this.removeMacroAndAliases(inputReceivers, comb);

    if (comb.circular && commands.length > 0) {
      await this.runCommand(commands[this.activeFighterIndex]);
      if (this.activeFighterIndex >= commands.length - 1) {
        this.activeFighterIndex = 0;
      } else if (this.activeFighterIndex + 1 <= commands.length - 1) {
        this.activeFighterIndex++;
      }
    } else {
      for (const receiver of commands) {
        // eslint-disable-next-line no-await-in-loop
        await this.runCommand(receiver);
        // eslint-disable-next-line no-await-in-loop
        await this.awaitDelay(comb.delay, receiver.delay as number);
      }
    }
  }

  private removeMacroAndAliases(inputReceivers: CommandOrMacro[], comb: Omit<EventData, 'threads' | 'commands'>): Command[] {
    let processReceivers: Command[] = [];
    for (const inpRec of inputReceivers) {
      if ((inpRec as MacroCommand).macro) {
        const executable = this.configService.getMacros()[(inpRec as MacroCommand).macro];
        for (const command of executable.commands) {
          processReceivers.push(this.replacePlaceholders(command, (inpRec as MacroCommand).variables));
        }
      } else {
        processReceivers.push(inpRec as Command);
      }
    }
    processReceivers = processReceivers.map(rec => this.replaceGlobalVars(rec));

    const commands = this.constructReceivers(processReceivers);
    if (comb.shuffle) {
      this.shuffle(commands);
    }
    return commands;
  }

  private constructReceivers(inputReceivers: Command[]): Command[] {
    const commands: Command[] = [];
    inputReceivers.forEach(rec => {
      if (this.configService.getIps()[rec.destination]) {
        commands.push({...rec, destination: rec.destination});
        return;
      }
      const destination = this.configService.getAliases()[rec.destination];
      if (typeof destination === 'string') {
        commands.push({...rec, destination});
      } else if (Array.isArray(destination)) {
        destination.forEach(dest => {
          commands.push({...rec, destination: dest});
        });
      } else {
        throw Error(`Unknown destination type ${rec.destination}`);
      }
    });
    return commands;
  }

  private async awaitDelay(combDelay: undefined | number, receiverDelay: undefined | number): Promise<void> {
    if (receiverDelay !== undefined) {
      combDelay = receiverDelay;
    }
    if (combDelay === undefined) {
      combDelay = Math.round(Math.random() * this.configService.getDelay());
    }
    await new Promise(resolve => {
      setTimeout(resolve, combDelay);
    });
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
