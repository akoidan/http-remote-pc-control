import {Injectable, Logger} from '@nestjs/common';


@Injectable()
export class RandomService {
  constructor(
    private readonly logger: Logger,
  ) {
  }

  /**
   * Generates a random number based on a given value x and a deviation factor d, where the result stays within the range x ± d * x.
   */
  public calcDeviation(x: number, d?: number): number {
    if (d) {
      const randomVariator = 1 + ((2 * Math.random() - 1) * d);
      return Math.round(x * randomVariator);
    }
    return x;
  }
}
