import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {JwtService} from '@/client/jwt-service';

interface FetchError extends Error {
  name: string;
}

@Injectable()
export class FetchClient {
  constructor(
    private readonly logger: Logger,
    private readonly jwtService: JwtService,
    private readonly protocol: string,
    private readonly port: number,
  ) {}

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async post(client: string, url: string, payload: any, timeout = 3000): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.protocol}://${client}:${this.port}/${url}`, {
        method: 'POST',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.jwtService.getToken()}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await response.text();
      if (!response.ok) {
        throw Error(text);
      }
      this.logger.debug(`POST:OK ${client}/${url} ${JSON.stringify(payload)}: ${text}`);
    } catch (error: unknown) {
      const err = error as FetchError;
      if (err.name === 'AbortError') {
        throw new Error(`POST:TIMEOUT: ${client}/${url} - Request timed out after ${timeout}ms`);
      }
      throw new Error(`POST:FAIL: ${client}/${url} : ${err.message}`);
    }
  }

  async get(client: string, url: string, timeout = 3000): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.protocol}://${client}:${this.port}/${url}`, {
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${this.jwtService.getToken()}`,
        },
      });

      clearTimeout(timeoutId);
      const text = await response.text();
      if (!response.ok) {
        throw Error(text);
      }
      this.logger.debug(`GET:OK ${client}/${url}: ${text}`);
    } catch (error: unknown) {
      const err = error as FetchError;
      if (err.name === 'AbortError') {
        throw new Error(`GET:TIMEOUT: ${client}/${url} - Request timed out after ${timeout}ms`);
      }
      throw new Error(`GET:FAIL ${client}/${url} : ${err.message}`);
    }
  }
}
