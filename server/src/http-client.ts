interface RequestData<T> {
  payload?: T;
}

export class FetchClient {
  constructor(private url: string) {
  }

  async post<T>(url: string, data: RequestData<T>, timeout = 3000): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(`${this.url}/${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await res.text();
      if (!res.ok) {
        throw Error(text);
      }
      console.debug(`POST:OK ${this.url}/${url} ${JSON.stringify(data)}: ${text}`);
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error(`POST:TIMEOUT: ${this.url}/${url} - Request timed out after 3s`);
      }
      throw new Error(`POST:FAIL: ${this.url}/${url} : ${e.message}`, e);
    }
  }

  async get(url: string): Promise<void> {
     try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${this.url}/${url}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const text = await res.text();
      if (!res.ok) {
        throw Error(text);
      }
      console.debug(`GET:OK ${this.url}/${url}: ${text}`);
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error(`GET:TIMEOUT: ${this.url}/${url} - Request timed out after 3s`);
      }
      throw new Error(`GET:FAIL ${this.url}/${url} : ${e.message}`, e);
    }
  }
}
