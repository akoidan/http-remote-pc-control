/* eslint-disable max-lines */

import {Inject, Injectable, Logger} from '@nestjs/common';
import {INativeModule, MouseButton, Native} from '@/native/native-model';
import {sleep} from '@/shared';
import {MouseClickRequest, MouseMoveHumanClickRequest, MousePositionResponse} from '@/mouse/mouse-dto';
import {OS_INJECT} from "@/global/global-model";
import {Safe400} from "@/utils/decorators";


@Injectable()
export class MouseService {
  constructor(
    readonly logger: Logger,
    @Inject(OS_INJECT)
    readonly os: NodeJS.Platform,
    @Inject(Native)
    private readonly addon: INativeModule,
  ) {
  }

  @Safe400(['darwin'])
  // eslint-disable-next-line @typescript-eslint/require-await
  moveLeftClick(x: number, y: number): void {
    this.logger.log(`Left click: \u001b[35m[${x},${y}]`);
    this.addon.mouseMove(x, y);
    this.addon.mouseClick(MouseButton.LEFT);
  }

  @Safe400(['darwin'])
  move(x: number, y: number): void {
    this.logger.log(`Mouse move: \u001b[35m[${x},${y}]`);
    this.addon.mouseMove(x, y);
  }

  @Safe400(['darwin'])
  getPosition(): MousePositionResponse {
    return this.addon.getMousePos();
  }

  @Safe400(['darwin'])
  click(body: MouseClickRequest): void {
    this.addon.mouseClick(body.button);
  }

  @Safe400(['darwin'])
  async moveMouseHuman(event: MouseMoveHumanClickRequest): Promise<void> {
    this.logger.log(`Mouse human: \u001b[35m[${event.x},${event.y}]`);
    const {x: x1, y: y1} = this.addon.getMousePos();
    let x2 = event.x;
    let y2 = event.y;

    // Add final position randomization if specified
    if (event.destinationRandomX) {
      x2 += Math.round((Math.random() * 2 - 1) * event.destinationRandomX);
    }
    if (event.destinationRandomY) {
      y2 += Math.round((Math.random() * 2 - 1) * event.destinationRandomY);
    }

    // Calculate distance and movement parameters
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);

    // Calculate steps with configurable speed
    const basePxPerIt = event.pixelsPerIteration ?? 50;
    const steps = Math.max(3, Math.round(distance / basePxPerIt));

    // Calculate curve intensity with deviation
    const baseCurveIntensity = Math.min(1, Math.max(0.1, event.curveIntensity ?? 0.3));
    const curveDeviation = (event.curveIntensityDeviation ?? 0.2) * baseCurveIntensity;
    const curveIntensity = Math.min(1, Math.max(0.1,
        baseCurveIntensity + (Math.random() * 2 - 1) * curveDeviation));

    this.logger.debug(`Mouse human: \u001b[35m[${x1},${y1}] -> [${x2},${y2}] in ${steps} steps with curve intensity ${curveIntensity.toFixed(2)}`);
    // Move through the curve
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      // Get point on the smooth curve
      const {x, y} = this.getCurvePoint(t, x1, y1, x2, y2, curveIntensity);
      // Move to the calculated position
      this.addon.mouseMove(Math.round(x), Math.round(y));
      await sleep(event.delayBetweenIterations ?? 5);
    }

    // Ensure we hit the target exactly
    this.addon.mouseMove(x2, y2);
  }

  /**
   * Calculate a point on a quadratic Bézier curve
   */
  private quadBezier(p0: number, p1: number, p2: number, t: number): number {
    const mt = 1 - t;
    return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
  }

  /**
   * Generate a smooth random value that changes gradually
   */
  private smoothRandom(seed: number, t: number): number {
    const t0 = Math.floor(t);
    const t1 = t0 + 1;
    const gt0 = this.gradient(seed + t0, t - t0);
    const gt1 = this.gradient(seed + t1, t - t1);
    const fadeT = this.fade(t - t0);
    return gt0 + (gt1 - gt0) * fadeT;
  }

  /**
   * Fade function for smooth interpolation
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Gradient function for Perlin noise
   */
  private gradient(seed: number, t: number): number {
    const x = Math.sin(seed * 12.9898 + t * 4.1414) * 43758.5453;
    return x - Math.floor(x);
  }

  /**
   * Generate a point along a smooth curved path
   */
  private getCurvePoint(
    t: number, 
    x1: number, y1: number, 
    x2: number, y2: number,
    curveIntensity: number
  ): {x: number, y: number} {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    
    // Create a smooth curve with controlled intensity
    const offsetScale = (0.1 + curveIntensity * 0.4) * (0.9 + 0.2 * Math.random());
    // Alternate curve direction based on position for more natural movement
    const curveDirection = (x1 + y1) % 2 > 1 ? 1 : -1;
    const offsetAngle = angle + curveDirection * Math.PI / 4; // 45 degree curve
    
    // Calculate control point for the curve
    const cx = x1 + dx * 0.5 + Math.cos(offsetAngle) * dist * offsetScale;
    const cy = y1 + dy * 0.5 + Math.sin(offsetAngle) * dist * offsetScale;
    
    // Get point on the curve with easing
    const tEased = this.easeInOut(t);
    const x = this.quadBezier(x1, cx, x2, tEased);
    const y = this.quadBezier(y1, cy, y2, tEased);
    
    return {x, y};
  }

  private rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  //
  // Robert Penner’s easing equation
  // Smoothly accelerates and decelerates motion over time (ease-in-out cubic curve).
  // Input: t ∈ [0,1] → Output: eased progress ∈ [0,1], slower at start/end, faster in middle.
  //
  private easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  }
}
