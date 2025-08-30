import {Inject, Injectable, Logger} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';

@Injectable()
export class ProcessService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
  ) {}

  public createProcess(path: string, cmd?: string): number {
    return this.addon.createProcess(path, cmd);
  }

  public getProcessMainWindow(pid: number): number {
    return this.addon.getProcessMainWindow(pid);
  }
}
