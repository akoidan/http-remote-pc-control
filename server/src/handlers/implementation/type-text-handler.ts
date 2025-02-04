import type {
  Command,
  TypeTextCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class TypeTextHandler extends CommandHandler {
  canHandle(command: Command): command is TypeTextCommand {
    return 'typeText' in command;
  }

  async execute(ip: string, command: TypeTextCommand): Promise<void> {
    await this.clientService.typeText(ip, {text: command.typeText});
  }
}
