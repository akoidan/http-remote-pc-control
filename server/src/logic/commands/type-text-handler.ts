import type {
  Command,
  TypeTextCommand,
} from '@/config/types/commands';
import {BaseCommandHandler} from 'src/logic/commands/base-command-handler';

export class TypeTextHandler extends BaseCommandHandler {
  canHandle(command: Command): command is TypeTextCommand {
    return 'typeText' in command;
  }

  async execute(ip: string, command: TypeTextCommand): Promise<void> {
    await this.clientService.typeText(ip, {text: command.typeText});
  }
}
