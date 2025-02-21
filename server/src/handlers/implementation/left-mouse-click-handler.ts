import type {
  Command,
  LeftMouseClickCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class LeftMouseClickHandler extends CommandHandler {
  canHandle(command: Command): command is LeftMouseClickCommand {
    return 'leftMouseClick' in command;
  }

  async execute(destination: string): Promise<void> {
    await this.clientService.leftMouseClick(destination);
  }
}
