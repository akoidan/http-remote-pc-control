import type {
  Command,
  MouseClickCommand,
} from '@/config/types/commands';
import {BaseCommandHandler} from 'src/logic/commands/base-command-handler';

export class MouseClickHandler extends BaseCommandHandler {
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
