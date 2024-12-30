import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  Agent,
  request,
} from 'https';

interface FetchError extends Error {
  name: string;
}

@Injectable()
export class FetchClient {
  constructor(
    private readonly logger: Logger,
    private readonly agent: Agent,
    private readonly protocol: string,
    private readonly port: number,
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async post(client: string, url: string, payload: any, timeout = 3000): Promise<void> {
    try {
      const payloadstr: string = JSON.stringify(payload);
      const result = await new Promise<string>((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          reject(Error(`Request timed out after ${timeout}m`));
          controller.abort();
        }, timeout);
        const req = request({
          agent: this.agent,
          port: this.port,
          host: client,
          path: url,
          signal: controller.signal,
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Length': Buffer.byteLength(payloadstr),
          },
          method: 'POST',
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            clearTimeout(timeoutId);
            resolve(data);
          });
          res.on('error', (e) => {
            clearTimeout(timeoutId);
            reject(e);
          });
        });

        req.write(payloadstr);
        req.end();
      });
      this.logger.debug(`POST:OK ${client}/${url} ${payloadstr}: ${result}`);
    } catch (error: unknown) {
      throw new Error(`POST:FAIL ${this.protocol}://${client}:${this.port}/${url} ${(error as any).message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async get(client: string, url: string, timeout = 3000): Promise<void> {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          reject(Error(`Request timed out after ${timeout}m`));
          controller.abort();
        }, timeout);
        const req = request({
          agent: this.agent,
          port: this.port,
          host: client,
          path: url,
          signal: controller.signal,
          method: 'POST',
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            clearTimeout(timeoutId);
            if (!(res.statusCode! < 400)) {
              reject(Error(`status code ${res.statusCode} ${data}`));
            } else {
              resolve(data);
            }
          });
          res.on('error', (e) => {
            clearTimeout(timeoutId);
            reject(e);
          });
        });
        req.end();
      });

      this.logger.debug(`GET:OK ${this.protocol}://${client}:${this.port}/${url} ${result}`);
    } catch (error: unknown) {
      throw new Error(`GET:FAIL ${this.protocol}://${client}:${this.port}/${url} ${(error as any).message}`);
    }
  }
}
