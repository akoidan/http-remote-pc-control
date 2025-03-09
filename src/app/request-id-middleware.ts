import {
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import {asyncLocalStorage} from '@/app/custom-logger';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/explicit-module-boundary-types
  use(req: any, res: any, next: () => void) {
    const comb = asyncLocalStorage.getStore()?.get('comb');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    asyncLocalStorage.run(new Map().set('comb', comb), () => {
      const reqId = Math.random().toString(36).substring(2, 6);
      asyncLocalStorage.getStore()?.set('comb', reqId);

      const {method, originalUrl, body} = req;

      this.logger.debug(`<<== ${method} ${originalUrl} ${JSON.stringify(body)}`);
      req.requestId = reqId; // Attach it to the request for convenience

      const originalSend = res.send.bind(res); // Store the original send method

      // Override res.send to log the response body
      res.send = (resBody: string): any => {
        this.logger.debug(`==>> ${method} ${originalUrl}: ${resBody}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return originalSend(resBody); // Correctly call the original send method with the body
      };
      next();
    });
  }
}
