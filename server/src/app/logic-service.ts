import {
  EventData,
  ReceiveExecute,
  ReceiveMacro,
  Receiver,
  ReceiverAndMacro,
  ReceiverBase,
  ReceiverMouse,
  ReceiverSimple,
  ReceiveTypeText
} from "@/config/types";
import { ConfigService } from '@/config/config-service';
import { ClientService } from '@/client/client-service';
import {
  Injectable,
  Logger
} from '@nestjs/common';

@Injectable()
export class LogicService {

  constructor(
    private configService: ConfigService,
    private clientService: ClientService,
    private readonly logger: Logger,
  ) {
  }

  private activeFighterIndex: number = 0;

  async pingClients(): Promise<unknown[]> {
    this.logger.debug("Pinging clients...")
    return Promise.all(
      Object.entries(this.configService.getIps())
        .map(([name, ip]) => this.clientService.ping(ip))
    );
  }

  async runCommand(currRec: Receiver) {
    const ip = this.configService.getIps()[(currRec as ReceiverBase).destination];
    if ((currRec as ReceiverSimple).keySend) {
      await this.clientService.keyPress(ip, { key: (currRec as ReceiverSimple).keySend });
    } else if ((currRec as ReceiverMouse).mouseMoveX) {
      await this.clientService.mouseClick(ip, {
        x: (currRec as ReceiverMouse).mouseMoveX,
        y: (currRec as ReceiverMouse).mouseMoveY,
      });
    } else if ((currRec as ReceiveExecute).launch) {
      await this.clientService.launchExe(ip, {
        path: (currRec as ReceiveExecute).launch
      });
    } else if ((currRec as ReceiveTypeText).typeText) {
      await this.clientService.typeText(ip, {
        text: (currRec as ReceiveTypeText).typeText
      });
    } else {
      throw Error(`Unknown receiver type ${JSON.stringify(currRec)}`);
    }
  }

  replacePlaceholders<T>(obj: T, variables: Record<string, any> | undefined): T {
    if (!variables) {
      return obj;
    }
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      result[key] = value;
      for (const varName in variables) {
        if (value == `{{${varName}}}`) {
          result[key] = variables[varName];
        }
      }
    }
    return result as T;
  }


  async processEvent(comb: EventData) {
    this.logger.log(`${comb.shortCut} pressed`);
    if (comb.receivers) {
      await this.processReceiverEvent(comb, comb.receivers);
    } else if (comb.receiversMulti) {
      this.logger.log(`${comb.shortCut} processing ${comb.receiversMulti.length} in parallel`);
      await Promise.all(comb.receiversMulti.map(rec => this.processReceiverEvent(comb, rec)))
    } else {
      throw Error("Unknown event type");
    }
  }

  private async processReceiverEvent(comb: Omit<EventData, 'receiversMulti' | 'receivers'>, inputReceivers: ReceiverAndMacro[]) {
    const processReceivers: Receiver[] = [];
    for (const inpRec of inputReceivers) {
      if ((inpRec as ReceiveMacro).macro) {
        const executable = this.configService.getMacros()[(inpRec as ReceiveMacro).macro];
        for (const command of executable.commands) {
          processReceivers.push(this.replacePlaceholders(command, (inpRec as ReceiveMacro).variables));
        }
      } else {
        processReceivers.push(inpRec);
      }
    }

    const receivers = this.constructReceivers(processReceivers);
    if (comb.shuffle) {
      this.shuffle(receivers);
    }

    // const receivers: string[] = comb.receivers.map(rec => this.config.urls[rec as keyof ConfigUrl]).flatMap(a => a);
    if (comb.circular && receivers.length > 0) {
      await this.runCommand(receivers[this.activeFighterIndex]);
      if (this.activeFighterIndex >= receivers.length - 1) {
        this.activeFighterIndex = 0;
      } else if (this.activeFighterIndex + 1 <= receivers.length - 1) {
        this.activeFighterIndex++;
      }
    } else {
      for (let i = 0; i < receivers.length; i++) {
        await this.runCommand(receivers[i]);
        await this.awaitDelay(comb.delay, receivers[i].delay);
      }
    }
  }

  private constructReceivers(inputReceivers: Receiver[]): Receiver[] {
    const receivers: ReceiverAndMacro[] = [];
    inputReceivers.forEach(rec => {
      if (this.configService.getIps()[rec.destination]) {
        receivers.push({
          ...rec,
          destination: rec.destination,
        })
        return
      }
      const dest = this.configService.getAliases()[rec.destination];
      if (typeof dest === 'string') {
        receivers.push({
          ...rec,
          destination: dest,
        })
      } else if (Array.isArray(dest)) {
        dest.forEach(dest => {
          receivers.push({
            ...rec,
            destination: dest,
          })
        })
      } else {
        throw Error(`Unknown destination type ${rec.destination}`);
      }
    })
    return receivers;
  }

  private async awaitDelay(combDelay: undefined | number, receiverDelay: undefined | number) {
    if (receiverDelay !== undefined) {
      combDelay = receiverDelay;
    }
    if (combDelay === undefined) {
      combDelay = Math.round(Math.random() * this.configService.getDelay())
    }
    await new Promise(resolve => setTimeout(resolve, combDelay));
  }

  /**
   * Fisher-Yates (Knuth) shuffle
   */
  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
