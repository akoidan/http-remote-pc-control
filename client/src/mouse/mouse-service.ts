import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  mouse,
  Point,
} from '@nut-tree-fork/nut-js';

@Injectable()
export class MouseService {
  constructor(
    private readonly logger: Logger
  ) {
  }

  async click(x: number, y: number): Promise<void> {
    this.logger.log(`Left click: \u001b[35m[${x},${y}]`);
    await mouse.setPosition(new Point(x,y));
    await mouse.leftClick();
  }
}
