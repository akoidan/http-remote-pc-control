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

  abstract execute(destination: string, command: Command): Promise<void>;

  async handle(destination: string, command: Command): Promise<void> {
    if (this.canHandle(command)) {
      await this.execute(destination, command);
    } else if (this.next) {
      await this.next.handle(destination, command);
    } else {
      throw new Error(`No handler found for command type: ${JSON.stringify(command)}`);
    }
  }
}
