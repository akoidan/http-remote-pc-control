import {Inject, Injectable, Logger} from '@nestjs/common';
import {Native, ProcessNativeModule, WindowNativeModule} from '@/native/native-model';
import {Safe400} from "@/utils/decorators";
import {OS_INJECT} from "@/global/global-model";

@Injectable()
export class ProcessService {
  constructor(
    public readonly logger: Logger,
    @Inject(Native)
    private readonly addonProcess: ProcessNativeModule,
    @Inject(Native)
    private readonly addonWindow: WindowNativeModule,
    @Inject(OS_INJECT)
    public readonly os: NodeJS.Platform,
  ) {
  }

  @Safe400(['win32', 'linux'])
  public createProcess(path: string, cmd?: string): number {
    return this.addonProcess.createProcess(path, cmd);
  }

  @Safe400(['win32', 'linux'])
  public getProcessInfo(pid: number): any {
    const info = this.addonProcess.getProcessInfo(pid);
    const wids = this.addonWindow.getWindowsByProcessId(pid);
    return {
      ...info,
      wids,
    };
  }
}
