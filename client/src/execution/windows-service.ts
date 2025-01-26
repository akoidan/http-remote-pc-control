import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  InjectPinoLogger,
  PinoLogger,
} from 'nestjs-pino';

import {platform} from 'os';
import {
  bringWindoToTop,
  getAllWindows,
  Window,
} from '@/native/node-window-manager';

@Injectable()
export class WindowsService {
  constructor(
    @InjectPinoLogger(WindowsService.name)
    private readonly logger: PinoLogger
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
      bringWindoToTop(window.id);
    } else {
      throw new BadRequestException('Not supported on this platform');
    }
  }
}



