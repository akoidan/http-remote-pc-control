import { FetchClient } from '@/http-client';
import {
  LaunchExeRequest,
  MouseClickRequest,
  SendKeyRequest,
  TypeTextRequest
} from '@/dto/event';


export class Api {
  private client: FetchClient;

  constructor(private url: string, private name: string) {
    this.client = new FetchClient(`http://${url}:5000`);
  }

  async ping(): Promise<void> {
    return this.client.get('ping');
  }

  async keyPress(request: SendKeyRequest): Promise<void> {
    console.log(`${this.name} -> ${request.key}`);
    return this.client.post('key-press', { payload: request });
  }

  async mouseClick(request: MouseClickRequest): Promise<void> {
    return this.client.post('mouse-click', { payload: request });
  }

  async launchExe(request: LaunchExeRequest): Promise<void> {
    return this.client.post('launch-exe', { payload: request });
  }

  async typeText(request: TypeTextRequest): Promise<void> {
    return this.client.post('type-text', { payload: request }, 9000);
  }
}
