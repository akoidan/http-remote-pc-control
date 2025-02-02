import {
  Injectable,
  Logger,
} from '@nestjs/common';


@Injectable()
export class MouseService {
  constructor(
    private readonly logger: Logger
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async click(x: number, y: number): Promise<void> {
    this.logger.log(`Left click: \u001b[35m[${x},${y}]`);
    throw new Error('Not implemented');
  }
}
