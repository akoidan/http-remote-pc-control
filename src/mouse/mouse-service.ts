import {Inject, Injectable, Logger,} from '@nestjs/common';
import {INativeModule, Native,} from '@/native/native-model';
import {sleep} from "@/shared";
import {MouseMoveHumanClickRequest, MousePositionResponse} from "@/mouse/mouse-dto";


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

  getMousePos(): MousePositionResponse {
    return this.addon.getMousePos();
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
   * Generate a point along a natural-looking mouse path with some randomness
   */
  private getNaturalPoint(
    t: number, 
    x1: number, y1: number, 
    x2: number, y2: number,
    seed: number,
    curveIntensity: number,
    tremorIntensity: number
  ): {x: number, y: number} {
    // Calculate control point for the quadratic Bézier curve
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    
    // Calculate curve control point with configurable intensity
    const baseOffsetScale = 0.1 + curveIntensity * 0.4; // 0.1 to 0.5
    const offsetScale = baseOffsetScale * (0.8 + 0.4 * Math.random());
    const offsetAngle = angle + (Math.random() - 0.5) * Math.PI * 0.8; // Wider angle for more natural curves
    
    // Calculate control point with some randomness
    const cx = x1 + dx * 0.5 + Math.cos(offsetAngle) * dist * offsetScale;
    const cy = y1 + dy * 0.5 + Math.sin(offsetAngle) * dist * offsetScale;
    
    // Get point on the curve with easing
    const tEased = this.easeInOut(t);
    const x = this.quadBezier(x1, cx, x2, tEased);
    const y = this.quadBezier(y1, cy, y2, tEased);
    
    // Add subtle tremor effect if enabled
    if (tremorIntensity > 0) {
      const tremorScale = tremorIntensity * (0.5 + 0.5 * Math.sin(t * 30 + seed));
      const tremorX = (Math.random() - 0.5) * tremorScale * 4;
      const tremorY = (Math.random() - 0.5) * tremorScale * 4;
      return {
        x: x + tremorX,
        y: y + tremorY
      };
    }
    
    return { x, y };
  }

  async moveMouseHuman(event: MouseMoveHumanClickRequest): Promise<void> {
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
    
    // Calculate steps with configurable speed and variance
    const basePxPerIt = event.pixelsPerIteration ?? 50;
    const speedVariance = event.movementVariance ?? 0.4;
    const pxPerIt = basePxPerIt * (1 - speedVariance * 0.5 + Math.random() * speedVariance);
    const steps = Math.max(3, Math.round(distance / pxPerIt));
    
    // Generate a random seed for this movement
    const seed = Math.random() * 1000;
    const curveIntensity = event.curveIntensity ?? 0.3;
    const tremorIntensity = event.tremorIntensity ?? 0.5;
    
    // Move through the curve
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      
      // Get point on the natural curve
      const {x, y} = this.getNaturalPoint(
        t, x1, y1, x2, y2, 
        seed + i * 0.1,
        curveIntensity,
        tremorIntensity
      );
      
      // Move to the calculated position
      this.addon.mouseMove(Math.round(x), Math.round(y));
      
      // Vary the delay for natural movement
      const baseDelay = event.delayBetweenIterations ?? 5;
      const delay = baseDelay * (0.8 + 0.4 * Math.random());
      await sleep(delay);
    }
    
    // Ensure we hit the target exactly
    this.addon.mouseMove(x2, y2);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async click(): Promise<void> {
    this.logger.log('Left click on current position');
    this.addon.mouseClick();
  }
}
