import type {
  Command,
  KillExeByNameCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class KillNameHandler extends CommandHandler {
  canHandle(command: Command): command is KillExeByNameCommand {
    return 'killByName' in command;
  }

  async execute(ip: string, command: KillExeByNameCommand): Promise<void> {
    await this.clientService.killExe(ip, {name: command.killByName});
  }
}
