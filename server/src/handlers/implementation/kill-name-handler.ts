import type {
  Command,
  KillExeByNameCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class KillNameHandler extends CommandHandler {
  canHandle(command: Command): command is KillExeByNameCommand {
    return 'killByName' in command;
  }

  async execute(destination: string, command: KillExeByNameCommand): Promise<void> {
    await this.clientService.killExeByName(destination, {name: command.killByName});
  }
}
