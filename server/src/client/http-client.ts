import { Logger } from '@nestjs/common';

export class FetchClient {

  constructor(
    private readonly logger: Logger,
    private protocol: string,
    private port: number) {

  }

  async post<T>(client: string, url: string, payload: T, timeout = 3000): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(`${this.protocol}://${client}:${this.port}/${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await res.text();
      if (!res.ok) {
        throw Error(text);
      }
      this.logger.debug(`POST:OK ${client}/${url} ${JSON.stringify(payload)}: ${text}`);
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error(`POST:TIMEOUT: ${client}/${url} - Request timed out after 3s`);
      }
      throw new Error(`POST:FAIL: ${client}/${url} : ${e.message}`, e);
    }
  }

  async get(client: string, url: string): Promise<void> {
     try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${this.protocol}://${client}:${this.port}/${url}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await res.text();
      if (!res.ok) {
        throw Error(text);
      }
      this.logger.debug(`GET:OK ${client}/${url}: ${text}`);
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error(`GET:TIMEOUT: ${client}/${url} - Request timed out after 3s`);
      }
      throw new Error(`GET:FAIL ${client}/${url} : ${e.message}`, e);
    }
  }
}
