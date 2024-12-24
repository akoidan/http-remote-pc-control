import { FetchClient } from '@/client/http-client';
import {
  LaunchExeRequest,
  MouseClickRequest,
  SendKeyRequest,
  TypeTextRequest
} from '@/client/dtos';
import { Injectable } from '@nestjs/common';


@Injectable()
export class ClientService {

  constructor(private readonly client: FetchClient) {
  }

  async ping(client: string): Promise<void> {
    return this.client.get(client, 'ping');
  }

  async keyPress(client: string, request: SendKeyRequest): Promise<void> {
    console.log(`${client} -> ${request.key}`);
    return this.client.post(client, 'key-press', request);
  }

  async mouseClick(client: string, request: MouseClickRequest): Promise<void> {
    return this.client.post(client, 'mouse-click', request);
  }

  async launchExe(client: string, request: LaunchExeRequest): Promise<void> {
    return this.client.post(client, 'launch-exe', request);
  }

  async typeText(client: string, request: TypeTextRequest): Promise<void> {
    return this.client.post(client, 'type-text', request, 9000);
  }
}
