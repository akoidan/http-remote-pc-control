import {BadRequestException, Inject, Injectable, Logger, NotImplementedException} from '@nestjs/common';
import {UIWindow} from '@/window/window-model';
import {INativeModule, Native} from '@/native/native-model';
import {OS_INJECT} from '@/window/window-consts';

@Injectable()
export class WindowService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
    @Inject(OS_INJECT)
    private readonly os: NodeJS.Platform,
  ) {

  }

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
  public async focusWindowId(wid: number): Promise<void> {
    this.logger.log(`Focusing window: \u001b[35m#${wid}`);
    this.addon.bringWindowToTop(wid);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async activateWindowByPid(pid: number): Promise<void> {
    const requiredWindows = await this.getAllWindowsByPid(pid);
    const requireWindow =  requiredWindows[requiredWindows.length - 1];
    if (requiredWindows.length > 1) {
      this.logger.debug(`Found ${requiredWindows.length} windows for pid ${pid}. Picking  ${requireWindow}`);
    }

    this.logger.log(`Focusing window: \u001b[35m#${requireWindow} for pid ${pid}`);
    this.addon.bringWindowToTop(requireWindow);
  }
}



