import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  INativeModule,
  Native,
} from '@/native/native-model';


@Injectable()
export class MouseService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async leftMouseMoveClick(x: number, y: number): Promise<void> {
    this.logger.log(`Left click: \u001b[35m[${x},${y}]`);
    this.addon.mouseMove(x, y);
    this.addon.mouseClick();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async click(): Promise<void> {
    this.logger.log('Left click on current position');
    this.addon.mouseClick();
  }
}
