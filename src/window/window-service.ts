import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { UIWindow } from '@/window/window-model';
import {
  INativeModule,
  Native
} from '@/native/native-model';
import os from 'os';

@Injectable()
export class WindowService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule
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
  async activateWindow(pid: number): Promise<void> {
    const platform = os.platform();
    if (platform !== 'win32' && platform === 'linux') {
      throw new NotImplementedException(`Unsupported platform: ${platform}`);
    }

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
}



