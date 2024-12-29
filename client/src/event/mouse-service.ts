import { Injectable } from '@nestjs/common';


import {
  mouse,
  Point,
  straightTo
} from "@nut-tree-fork/nut-js";
import {
  InjectPinoLogger,
  PinoLogger
} from 'nestjs-pino';

@Injectable()
export class MouseService {

  constructor(
    @InjectPinoLogger(MouseService.name)
    private readonly logger: PinoLogger
  ) {
  }

  async click(x: number, y: number): Promise<void> {
    this.logger.info(`Left click: \u001b[35m${x} ${y}\u001b`);
    await mouse.setPosition(new Point(x,y));
    await mouse.leftClick();
  }
}
