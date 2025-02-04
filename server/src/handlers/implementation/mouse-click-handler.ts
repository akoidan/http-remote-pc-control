import type {
  Command,
  MouseClickCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class MouseClickHandler extends CommandHandler {
  canHandle(command: Command): command is MouseClickCommand {
    return 'mouseMoveX' in command;
  }

  async execute(ip: string, command: MouseClickCommand): Promise<void> {
    await this.clientService.mouseClick(ip, {
      x: command.mouseMoveX as number,
      y: command.mouseMoveY as number,
    });
  }
}
