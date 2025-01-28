import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  Agent,
  request,
} from 'https';

interface CustomError extends Error {
  statusCode?: number;
  response?: string;
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

  private async executeRequest(
    method: 'GET' | 'POST',
    client: string,
    url: string,
    payloadstr: string,
    controller: AbortController
  ): Promise<[string, number]> {
    return new Promise<[string, number]>((resolve, reject) => {
      const req = request({
        agent: this.agent,
        port: this.port,
        host: client,
        signal: controller.signal,
        protocol: this.protocol,
        path: url,
        method,
        headers: method === 'POST' ? {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'Content-Type': 'application/json',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'Content-Length': Buffer.byteLength(payloadstr),
        } : undefined,
      }, (res) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode! < 400) {
            resolve([data, res.statusCode!]);
          } else {
            const error = Error();
            (error as CustomError).statusCode = res.statusCode;
            (error as CustomError).response = data;
            reject(error);
          }
        });
        res.on('error', (error: Error) => reject(error));
      });

      if (method === 'POST' && payloadstr) {
        req.write(payloadstr);
      }
      req.end();
    });
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST',
    client: string,
    url: string,
    payload?: unknown,
    timeout: number = 3000,
    withParse: boolean = false,
  ): Promise<T> {
    const payloadstr: string = method === 'POST' && payload ? JSON.stringify(payload) : '';

    try {
      const controller = new AbortController();
      const [result, statusCode] = await Promise.race([
        this.executeRequest(method, client, url, payloadstr, controller),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            controller.abort();
            reject(Error(`Request timed out after ${timeout}m`));
          }, timeout);
        }),
      ]);

      this.logger.log(`${method}:${statusCode} ${client}${url}${payloadstr ?? ''} ==>> ${result}`);
      if (withParse) {
        try {
          return JSON.parse(result) as T;
        } catch (error) {
          throw new Error(`Failed to parse ${result}`);
        }
      }
      return null as T;
    } catch (error: unknown) {
      const status: number | 'FAIL' = (error as CustomError).statusCode ?? 'FAIL';
      const fullUrl: string = `${this.protocol}//${client}:${this.port}${url}`;
      throw new Error(
        `${method}:${status} ${fullUrl} ${(error as Error).message} ${payloadstr ?? ''} ==>> ${(error as CustomError).response ?? ''}`
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async post<T>(client: string, url: string, payload: any, timeout = 3000, withParse = false): Promise<T> {
    return this.makeRequest<T>('POST', client, url, payload, timeout, withParse);
  }

  async get<T>(client: string, url: string, timeout = 3000, withParse = false): Promise<T> {
    return this.makeRequest<T>('GET', client, url, undefined, timeout, withParse);
  }
}
