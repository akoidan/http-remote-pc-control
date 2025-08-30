import {Inject, Injectable, Logger} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';

@Injectable()
export class MonitorService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
  ) {}

  public getMonitors(): number[] {
    return this.addon.getMonitors();
  }

  public getMonitorInfo(mid: number) {
    return this.addon.getMonitorInfo(mid);
  }

  public getMonitorFromWindow(wid: number): number {
    return this.addon.getMonitorFromWindow(wid);
  }

  public getMonitorScaleFactor(mid: number): number {
    return this.addon.getMonitorScaleFactor(mid);
  }
}
