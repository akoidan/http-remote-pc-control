import type {
  Command,
  FocusWindowCommand,
} from '@/config/types/commands';
import {BaseCommandHandler} from 'src/logic/commands/base-command-handler';

export class FocusWindowHandler extends BaseCommandHandler {
  canHandle(command: Command): command is FocusWindowCommand {
    return 'focusPid' in command;
  }

  async execute(ip: string, command: FocusWindowCommand): Promise<void> {
    await this.clientService.focusExe(ip, {pid: command.focusPid as number});
  }
}
