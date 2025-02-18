import type {
  Command,
  MouseMoveClickCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class MouseClickHandler extends CommandHandler {
  canHandle(command: Command): command is MouseMoveClickCommand {
    return 'mouseMoveX' in command;
  }

  async execute(ip: string, command: MouseMoveClickCommand): Promise<void> {
    await this.clientService.mouseMoveClick(ip, {
      x: command.mouseMoveX as number,
      y: command.mouseMoveY as number,
    });
  }
}
