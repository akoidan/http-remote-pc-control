import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  IWindowService,
  UIWindow,
} from '@/window/window-model';
import {INativeModule} from '@/native/native-model';

@Injectable()
export class WindowLinuxService implements IWindowService {
    constructor(
    private readonly logger: Logger,
    private readonly addon: INativeModule
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async activateWindow(pid: number): Promise<void> {
    const windowsRaw = this.getAllWindows();
    const requiredWindows = windowsRaw.filter((win: UIWindow) => win.processId === pid);
    this.logger.debug(`Found following windows ids ${windowsRaw.map((win: UIWindow) => win.processId).join(', ')}`);
    if (requiredWindows.length === 0) {
      throw new BadRequestException(`Window not found ${pid}`);
    }
    this.logger.debug(`Found following windows for pid ${pid}: ${JSON.stringify(requiredWindows)}. Picking last`);
    const requireWindow = requiredWindows[requiredWindows.length - 1];
    this.logger.log(`Focusing window: \u001b[35m#${requireWindow.id} for pid ${pid}`);
    this.addon.bringWindowToTop(requireWindow.id);
  }

  private getAllWindows(): UIWindow[] {
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
}



