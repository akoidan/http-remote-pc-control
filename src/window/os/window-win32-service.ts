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
export class WindowWin32Service implements IWindowService {
  constructor(
    private readonly logger: Logger,
    private readonly addon: INativeModule
  ) {

  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async activateWindow(pid: number): Promise<void> {
    const windowsRaw = this.getAllWindows();
    const window = windowsRaw.find((win: UIWindow) => win.processId === pid);
    this.logger.debug(`Found following windows ids ${windowsRaw.map((win: UIWindow) => win.processId).join(', ')}`);
    if (!window) {
      throw new BadRequestException(`Window not found ${pid}`);
    }
    this.logger.log(`Focusing window: \u001b[35m#${window.id} for pid ${pid}`);
    this.addon.bringWindowToTop(window.id);
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



