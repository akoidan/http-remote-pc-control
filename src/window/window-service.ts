import {BadRequestException, Inject, Injectable, Logger, NotImplementedException} from '@nestjs/common';
import {UIWindow} from '@/window/window-model';
import {INativeModule, MonitorBounds, Native, WindowAction} from '@/native/native-model';
import {OS_INJECT} from '@/window/window-consts';
import {ActiveWindowResponseDto} from '@/window/window-dto';

@Injectable()
export class WindowService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
    @Inject(OS_INJECT)
    private readonly os: NodeJS.Platform,
  ) {}

  public getAllWindows(): UIWindow[] {
    return this.addon.getWindows().map((id: number) => {
      const initRes = this.addon.initWindow(id);
      const res: UIWindow = {
        id,
        path: initRes.path,
        processId: initRes.processId,
      };
      return res;
    }) as UIWindow[];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getAllWindowsByPid(pid: number): Promise<number[]> {
    if (!['win32', 'linux'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    const windowsRaw = this.getAllWindows();
    this.logger.debug(`Found following windows ids ${windowsRaw.map((win: UIWindow) => win.processId).join(', ')}`);
    const requiredWindows = windowsRaw.filter((win: UIWindow) => win.processId === pid).map((win: UIWindow) => win.id);
    if (requiredWindows.length === 0) {
      throw new BadRequestException(`No windows for pid ${pid} were found`);
    }
    return requiredWindows;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getActiveWindowInfo(): Promise<ActiveWindowResponseDto> {
    if (!['win32', 'linux'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    const windowsRaw = this.addon.getActiveWindowInfo();
    this.logger.debug(`Found following windows ids ${JSON.stringify(windowsRaw)}`);
    if (!windowsRaw.wid) {
      throw new BadRequestException('Error detecting active window');
    }
    return windowsRaw;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async focusWindowId(wid: number): Promise<void> {
    try {
      this.logger.log(`Focusing window: \u001b[35m#${wid}`);
      this.addon.bringWindowToTop(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to focus window ${wid} because ${e?.message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async activateWindowByPid(pid: number): Promise<void> {
    const requiredWindows = await this.getAllWindowsByPid(pid);
    const requireWindow = requiredWindows[requiredWindows.length - 1];
    if (requiredWindows.length > 1) {
      this.logger.debug(`Found ${requiredWindows.length} windows for pid ${pid}. Picking  ${requireWindow}`);
    }
    await this.focusWindowId(requireWindow);
  }

  // Extended window operations (direct pass-through to native addon)
  public getActiveWindow(): number {
    return this.addon.getActiveWindow();
  }

  public getWindowBounds(wid: number): MonitorBounds {
    return this.addon.getWindowBounds(wid);
  }

  public setWindowBounds(wid: number, bounds: MonitorBounds): boolean {
    return this.addon.setWindowBounds(wid, bounds);
  }

  public getWindowTitle(wid: number): string {
    return this.addon.getWindowTitle(wid);
  }

  public showWindow(wid: number, type: WindowAction): boolean {
    return this.addon.showWindow(wid, type);
  }

  public getWindowOpacity(wid: number): number {
    return this.addon.getWindowOpacity(wid);
  }

  public setWindowOpacity(wid: number, opacity: number): boolean {
    return this.addon.setWindowOpacity(wid, opacity);
  }

  public toggleWindowTransparency(wid: number, toggle: boolean): boolean {
    return this.addon.toggleWindowTransparency(wid, toggle);
  }

  public getWindowOwner(wid: number): number {
    return this.addon.getWindowOwner(wid);
  }

  public setWindowOwner(wid: number, owner: number): boolean {
    return this.addon.setWindowOwner(wid, owner);
  }

  public isWindow(wid: number): boolean {
    return this.addon.isWindow(wid);
  }

  public isWindowVisible(wid: number): boolean {
    return this.addon.isWindowVisible(wid);
  }

  public redrawWindow(wid: number): boolean {
    return this.addon.redrawWindow(wid);
  }

}



