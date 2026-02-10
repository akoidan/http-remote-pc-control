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
    return this.addon.createProcess(path, cmd);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getAllWindowsByPid(pid: number): Promise<number[]> {
    return this.addon.getWindowsByProcessId(pid);
  }

  public async getProcessInfo(pid: number): Promise<number[]> {
    const windows =  this.addon.getWindowsByProcessId(pid);
    const windows =  this.addon.get(pid);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async activateWindowByPid(pid: number): Promise<void> {
    const requiredWindows = await this.getAllWindowsByPid(pid);
    const requireWindow = requiredWindows[requiredWindows.length - 1];
    if (requiredWindows.length > 1) {
      this.logger.debug(`Found ${requiredWindows.length} windows for pid ${pid}. Picking  ${requireWindow}`);
    }
    this.addon.setWindowActive(requireWindow);
  }

}
