import {Injectable} from '@nestjs/common';

@Injectable()
export class CircularIndex {
  private activeFighterIndex: Record<string, number> = {};

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getNextFighterIndex<T>(anyKey: any, commands: T[]): T {
    const key: string = typeof anyKey === 'string' ?  anyKey : JSON.stringify(anyKey);
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
}
