import {Inject, Injectable, Logger, NotImplementedException} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';
import {OS_INJECT} from '@/window/window-consts';

@Injectable()
export class ProcessService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
    @Inject(OS_INJECT)
    private readonly os: NodeJS.Platform,
  ) {
  }

  public createProcess(path: string, cmd?: string): number {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    return this.addon.createProcess(path, cmd);
  }

  public getProcessMainWindow(pid: number): number {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    return this.addon.getProcessMainWindow(pid);
  }
}
