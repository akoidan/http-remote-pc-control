import type {
  Command,
  Key,
  KeyPressCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class KeyPressHandler extends CommandHandler {
  canHandle(command: Command): command is KeyPressCommand {
    return 'keySend' in command;
  }

  async execute(ip: string, command: KeyPressCommand): Promise<void> {
    let holdKeys: Key[] = [];
    if (Array.isArray(command.holdKeys)) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      holdKeys = command.holdKeys;
    } else if (command.holdKeys) {
      holdKeys = [command.holdKeys as Key];
    }

    await this.clientService.keyPress(ip, {
      keys: (Array.isArray(command.keySend) ? command.keySend : [command.keySend]) as Key[],
      holdKeys,
    });
  }
}
