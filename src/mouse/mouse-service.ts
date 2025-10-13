import {Inject, Injectable, Logger,} from '@nestjs/common';
import {INativeModule, Native,} from '@/native/native-model';
import {sleep} from "@/shared";
import {MouseMoveHumanClickRequest} from "@/mouse/mouse-dto";


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

  rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Robert Penner’s easing equation
   * Smoothly accelerates and decelerates motion over time (ease-in-out cubic curve).
   * Input: t ∈ [0,1] → Output: eased progress ∈ [0,1], slower at start/end, faster in middle.
   * */
  easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  }


  async moveMouseHuman(event: MouseMoveHumanClickRequest): Promise<void> {
    const {x: x1, y: y1} = this.addon.getMousePos();
    const dx = event.x - x1;
    const dy = event.y - y1;
    const distance = Math.hypot(dx, dy);

    const calcStep = (Math.random() - 0.5) * (event.iterationDeviation ?? 0.2) * (event.iterations ?? 3) + (event.iterations ?? 3);
    const steps = Math.round(distance / 100 * calcStep);

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const eased = this.easeInOut(t);
      let jitterX: number = 0;
      let jitterY: number = 0;
      if (typeof event.jitter === 'number') {
        jitterX = this.rand(-event.jitter, event.jitter);
        jitterY = this.rand(-event.jitter, event.jitter);
      } else {
        jitterX = this.rand(-2, 2);
        jitterY = this.rand(-2, 2);
      }
      const cx = Math.round(x1 + dx * eased + jitterX);
      const cy = Math.round(y1 + dy * eased + jitterY);
      this.addon.mouseMove(cx, cy);
      await sleep(this.rand(1, (event.slowness ?? 7) + 1));
    }
    const rX: number = event.destinationRandomX ? this.rand(-event.destinationRandomX, event.destinationRandomX) : 0;
    const rY: number = event.destinationRandomY ? this.rand(-event.destinationRandomY, event.destinationRandomY) : 0;
    this.addon.mouseMove(Math.round(event.x + rX), Math.round(event.y + rY));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async click(): Promise<void> {
    this.logger.log('Left click on current position');
    this.addon.mouseClick();
  }
}
