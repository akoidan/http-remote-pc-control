import type {
  Command,
  KillCommand,
} from '@/config/types/commands';
import {BaseCommandHandler} from 'src/logic/commands/base-command-handler';

export class KillHandler extends BaseCommandHandler {
  canHandle(command: Command): command is KillCommand {
    return 'kill' in command;
  }

  async execute(ip: string, command: KillCommand): Promise<void> {
    await this.clientService.killExe(ip, {name: command.kill});
  }
}
