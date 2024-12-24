import {
  Aliases,
  EventData,
  Ips,
  ReceiveExecute,
  Receiver,
  ReceiverMouse,
  ReceiverSimple,
  ReceiveTypeText
} from "@/types";
import { Api } from '@/client';

export class Logic {

  constructor(
    private ips: Ips,
    private aliases: Aliases,
    private delay: number,
  ) {

  }

  private activeFighterIndex: number = 0;
  private ids: Record<string, Api> = {};

  async createApi() {
    return Promise.all(Object.entries(this.ips).map(([name, ip]) => {
      const api = new Api(ip, name);
      this.ids[name] = api;
      return api.ping();
    }));
  }

  async runCommand(currRec: Receiver) {
    if ((currRec as ReceiverSimple).keySend) {
      await this.ids[currRec.destination].keyPress({ key: (currRec as ReceiverSimple).keySend });
    } else if ((currRec as ReceiverMouse).mouseMoveX) {
      await this.ids[currRec.destination].mouseClick({
        x: (currRec as ReceiverMouse).mouseMoveX,
        y: (currRec as ReceiverMouse).mouseMoveY,
      });
    } else if ((currRec as ReceiveExecute).launch) {
      await this.ids[currRec.destination].launchExe({
        path: (currRec as ReceiveExecute).launch
      });
    } else if ((currRec as ReceiveTypeText).typeText) {
      await this.ids[currRec.destination].typeText({
        text: (currRec as ReceiveTypeText).typeText
      });
    } else {
      throw Error(`Unknown receiver type ${JSON.stringify(currRec)}`);
    }
  }


  async processEvent(comb: EventData) {
    console.log(`${comb.shortCut} pressed`);
    if (comb.receivers) {
      await this.processReceiverEvent(comb, comb.receivers);
    } else if (comb.receiversMulti) {
      console.log(`${comb.shortCut} processing ${comb.receiversMulti.length} in parallel`);
      await Promise.all(comb.receiversMulti.map(rec => this.processReceiverEvent(comb, rec)))
    } else {
      throw Error("Unknown event type");
    }
  }

  private async processReceiverEvent(comb: Omit<EventData, 'receiversMulti' | 'receivers'>, inputReceivers: Receiver[]) {
    // but same as receiver but destination would be an ip
    const receivers: Receiver[] = [];
    inputReceivers.forEach(rec => {
      this.aliases[rec.destination].forEach(dest => {
        receivers.push({
          ...rec,
          destination: dest,
        })
      })
    })
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
        let delay = comb.delay;
        if (receivers[i].delay !== undefined) {
          delay = receivers[i].delay;
        }
        if (delay === undefined) {
          delay = Math.round(Math.random() * this.delay)
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
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
