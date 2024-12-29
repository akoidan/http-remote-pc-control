/* eslint-disable max-lines */
import {
  ReceiveExecute,
  ReceiveMacro,
  ReceiverBase,
  ReceiverMouse,
  ReceiverSimple,
  ReceiveTypeText,
  Receiver,
  ReceiverAndMacro, ReceiverKill,
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

  async runCommand(currRec: Receiver): Promise<void> {
    const ip = this.configService.getIps()[(currRec as ReceiverBase).destination];
    if ((currRec as ReceiverSimple).keySend) {
      await this.clientService.keyPress(ip, {key: (currRec as ReceiverSimple).keySend as string});
    } else if ((currRec as ReceiverMouse).mouseMoveX) {
      await this.clientService.mouseClick(ip, {
        x: (currRec as ReceiverMouse).mouseMoveX,
        y: (currRec as ReceiverMouse).mouseMoveY,
      });
    } else if ((currRec as ReceiveExecute).launch) {
      await this.clientService.launchExe(ip, {
        path: (currRec as ReceiveExecute).launch,
      });
    } else if ((currRec as ReceiveTypeText).typeText) {
      await this.clientService.typeText(ip, {
        text: (currRec as ReceiveTypeText).typeText,
      });
    }  else if ((currRec as ReceiverKill).kill) {
      await this.clientService.killExe(ip, {
        name: (currRec as ReceiverKill).kill,
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
    if (comb.receivers) {
      await this.processReceiverEvent(comb, comb.receivers);
    } else if (comb.receiversMulti) {
      this.logger.log(`${comb.shortCut} processing ${comb.receiversMulti.length} in parallel`);
      await Promise.all(comb.receiversMulti.map(async receiver => this.processReceiverEvent(comb, receiver)));
    } else {
      throw Error('Unknown event type');
    }
  }

  private async processReceiverEvent(
    comb: Omit<EventData, 'receiversMulti' | 'receivers'>,
    inputReceivers: ReceiverAndMacro[]
  ): Promise<void> {
    const receivers = this.removeMacroAndAliases(inputReceivers, comb);

    if (comb.circular && receivers.length > 0) {
      await this.runCommand(receivers[this.activeFighterIndex]);
      if (this.activeFighterIndex >= receivers.length - 1) {
        this.activeFighterIndex = 0;
      } else if (this.activeFighterIndex + 1 <= receivers.length - 1) {
        this.activeFighterIndex++;
      }
    } else {
      for (const receiver of receivers) {
        // eslint-disable-next-line no-await-in-loop
        await this.runCommand(receiver);
        // eslint-disable-next-line no-await-in-loop
        await this.awaitDelay(comb.delay, receiver.delay as number);
      }
    }
  }

  private removeMacroAndAliases(inputReceivers: ReceiverAndMacro[], comb: Omit<EventData, 'receiversMulti' | 'receivers'>): Receiver[] {
    let processReceivers: Receiver[] = [];
    for (const inpRec of inputReceivers) {
      if ((inpRec as ReceiveMacro).macro) {
        const executable = this.configService.getMacros()[(inpRec as ReceiveMacro).macro];
        for (const command of executable.commands) {
          processReceivers.push(this.replacePlaceholders(command, (inpRec as ReceiveMacro).variables));
        }
      } else {
        processReceivers.push(inpRec as Receiver);
      }
    }
    processReceivers = processReceivers.map(rec => this.replaceGlobalVars(rec));

    const receivers = this.constructReceivers(processReceivers);
    if (comb.shuffle) {
      this.shuffle(receivers);
    }
    return receivers;
  }

  private constructReceivers(inputReceivers: Receiver[]): Receiver[] {
    const receivers: Receiver[] = [];
    inputReceivers.forEach(rec => {
      if (this.configService.getIps()[rec.destination]) {
        receivers.push({...rec, destination: rec.destination});
        return;
      }
      const destination = this.configService.getAliases()[rec.destination];
      if (typeof destination === 'string') {
        receivers.push({...rec, destination});
      } else if (Array.isArray(destination)) {
        destination.forEach(dest => {
          receivers.push({...rec, destination: dest});
        });
      } else {
        throw Error(`Unknown destination type ${rec.destination}`);
      }
    });
    return receivers;
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
