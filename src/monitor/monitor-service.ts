import {Inject, Injectable, Logger} from '@nestjs/common';
import {INativeModule, MonitorInfo, Native} from '@/native/native-model';
import {Safe400} from '@/utils/decorators';
import {OS_INJECT} from '@/global/global-model';

@Injectable()
export class MonitorService {
  constructor(
    readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
    @Inject(OS_INJECT) readonly os: NodeJS.Platform,
  ) {}


  @Safe400(['win32', 'linux'])
  public getMonitors(): number[] {
    return this.addon.getMonitors();
  }

  @Safe400(['win32', 'linux'])
  public getMonitorInfo(mid: number): MonitorInfo {
    return this.addon.getMonitorInfo(mid);
  }

  @Safe400(['win32', 'linux'])
  public getMonitorFromWindow(wid: number): number {
    return this.addon.getMonitorFromWindow(wid);
  }
}
