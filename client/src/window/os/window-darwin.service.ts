import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {IWindowService} from '@/window/window-model';

@Injectable()
export class WindowDarwinService implements IWindowService {
  private readonly addon: any;

  constructor(
    private readonly logger: Logger
  ) {

  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async activateWindow(pid: number): Promise<void> {
    throw new BadRequestException(`Not supported int his os ${pid}`);
  }
}



