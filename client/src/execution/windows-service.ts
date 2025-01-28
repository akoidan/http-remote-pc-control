import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

import {platform} from 'os';
import {
  bringWindoToTop,
  getAllWindows,
  Window,
} from '@/native/node-window-manager';

@Injectable()
export class WindowsService {
  constructor(
    private readonly logger: Logger
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async activateWindow(pid: number): Promise<void> {
    if (platform() === 'win32') {
      const windowsRaw = getAllWindows();
      const window = windowsRaw.find((win: Window) => win.processId === pid);
      this.logger.debug(`Found following windows ids ${windowsRaw.map((win: Window) => win.processId).join(', ')}`);
      if (!window) {
        throw new BadRequestException(`Window not found ${pid}`);
      }
      this.logger.log(`Focusing window: \u001b[35m#${window.id} for pid ${pid}`);
      bringWindoToTop(window.id);
    } else {
      throw new BadRequestException('Not supported on this platform');
    }
  }
}



