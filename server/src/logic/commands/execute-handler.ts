import {
  Command,
  ExecuteCommand,
} from '@/config/types/commands';
import {BaseCommandHandler} from 'src/logic/commands/base-command-handler';
import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';

@Injectable()
export class ExecuteHandler extends BaseCommandHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: Command): command is ExecuteCommand {
    return 'launch' in command;
  }

  async execute(ip: string, command: ExecuteCommand): Promise<void> {
    const response = await this.clientService.launchExe(ip, {
      path: command.launch,
      arguments: command.arguments ?? [],
      waitTillFinish: command.waitTillFinish ?? false,
    });

    if (command.assignId) {
      await this.configService.setVariable(command.assignId, response.pid);
    }
  }
}
