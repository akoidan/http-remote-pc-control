import {BadRequestException, Inject, Injectable, Logger} from '@nestjs/common';
import {INativeModule, MonitorBounds, Native} from '@/native/native-model';

@Injectable()
export class MonitorService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
  ) {}

  public getMonitors(): number[] {
    try {
      this.logger.log('Calling getMonitors');
      return this.addon.getMonitors();
    } catch (e) {
      throw new BadRequestException(`Unable to list monitors because ${e?.message}`);
    }
  }

  public getMonitorInfo(mid: number): MonitorBounds {
    try {
      this.logger.log(`Calling getMonitorInfo for monitor #${mid}`);
      return this.addon.getMonitorInfo(mid);
    } catch (e) {
      throw new BadRequestException(`Unable to get monitor #${mid} info because ${e?.message}`);
    }
  }

  public getMonitorFromWindow(wid: number): number {
    try {
      this.logger.log(`Calling getMonitorFromWindow for window #${wid}`);
      return this.addon.getMonitorFromWindow(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to get monitor from window #${wid} because ${e?.message}`);
    }
  }

  public getMonitorScaleFactor(mid: number): number {
    try {
      this.logger.log(`Calling getMonitorScaleFactor for monitor #${mid}`);
      return this.addon.getMonitorScaleFactor(mid);
    } catch (e) {
      throw new BadRequestException(`Unable to get monitor #${mid} scale factor because ${e?.message}`);
    }
  }
}
