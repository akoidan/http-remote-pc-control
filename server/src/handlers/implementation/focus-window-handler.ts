import type {
  Command,
  FocusWindowCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class FocusWindowHandler extends CommandHandler {
  canHandle(command: Command): command is FocusWindowCommand {
    return 'focusPid' in command;
  }

  async execute(destination: string, command: FocusWindowCommand): Promise<void> {
    await this.clientService.focusExe(destination, {pid: command.focusPid as number});
  }
}
