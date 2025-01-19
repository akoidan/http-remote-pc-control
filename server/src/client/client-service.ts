import {FetchClient} from '@/client/http-client';
import {
  FocusExeRequest,
  KillExeRequest,
  LaunchExeRequest,
  LaunchPidResponse,
  MouseClickRequest,
  SendKeyRequest,
  TypeTextRequest,
} from '@/client/dtos';
import {Injectable} from '@nestjs/common';


@Injectable()
export class ClientService {
  constructor(private readonly client: FetchClient) {
  }

  async ping(client: string): Promise<void> {
    return this.client.get(client, '/ping');
  }

  async keyPress(client: string, request: SendKeyRequest): Promise<void> {
    return this.client.post(client, '/key-press', request);
  }

   async focusExe(client: string, request: FocusExeRequest): Promise<void> {
    return this.client.post(client, '/focus-exe', request);
  }

  async mouseClick(client: string, request: MouseClickRequest): Promise<void> {
    return this.client.post(client, '/mouse-click', request);
  }

  async launchExe(client: string, request: LaunchExeRequest): Promise<LaunchPidResponse> {
    return this.client.post(client, '/launch-exe', request);
  }

  async killExe(client: string, request: KillExeRequest): Promise<void> {
    return this.client.post(client, '/kill-exe', request);
  }

  async typeText(client: string, request: TypeTextRequest): Promise<void> {
    return this.client.post(client, '/type-text', request, 9000);
  }
}
