import type {
  Command,
  Key,
  KeyPressCommand,
} from '@/config/types/commands';
import {BaseCommandHandler} from 'src/logic/commands/base-command-handler';

export class KeyPressHandler extends BaseCommandHandler {
  canHandle(command: Command): command is KeyPressCommand {
    return 'keySend' in command;
  }

  async execute(ip: string, command: KeyPressCommand): Promise<void> {
    const holdKeys: Key[] = (Array.isArray(command.holdKeys)
      ? command.holdKeys
      : command.holdKeys ? [command.holdKeys] : []) as Key[];

    await this.clientService.keyPress(ip, {
      keys: (Array.isArray(command.keySend) ? command.keySend : [command.keySend]) as Key[],
      holdKeys,
    });
  }
}
