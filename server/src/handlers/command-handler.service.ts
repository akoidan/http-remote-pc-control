import {Command} from '@/config/types/commands';
import {ClientService} from '@/client/client-service';
import {Injectable} from '@nestjs/common';

@Injectable()
export abstract class CommandHandler {
  private next: CommandHandler | null = null;

  constructor(protected readonly clientService: ClientService) {
  }

  setNext(handler: CommandHandler): CommandHandler {
    this.next = handler;
    return handler;
  }

  abstract canHandle(command: Command): boolean;

  abstract execute(ip: string, command: Command): Promise<void>;

  async handle(ip: string, command: Command): Promise<void> {
    if (this.canHandle(command)) {
      await this.execute(ip, command);
    } else if (this.next) {
      await this.next.handle(ip, command);
    } else {
      throw new Error(`No handler found for command type: ${JSON.stringify(command)}`);
    }
  }
}
