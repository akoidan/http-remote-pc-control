import type {
  Command,
  KillExeByPidCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class KillPidHandler extends CommandHandler {
  canHandle(command: Command): command is KillExeByPidCommand {
    return 'killByPid' in command;
  }

  async execute(ip: string, command: KillExeByPidCommand): Promise<void> {
    if (!command.killByPid) {
      throw new Error(`Unable to kill a process in ${ip}, since variable resolved to undefined`);
    }
    await this.clientService.killExeById(ip, {pid: command.killByPid as number});
  }
}
