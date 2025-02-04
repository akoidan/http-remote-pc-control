import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {Command} from '@/config/types/commands';
import {
  CommandOrMacro,
  MacroCommand,
} from '@/config/types/macros';
import {VariableResolutionService} from 'src/logic/variable-resolution.service';
import {CommandHandler} from '@/handlers/command-handler.service';

@Injectable()
export class CommandProcessingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly variableService: VariableResolutionService,
    private readonly logger: Logger,
    private readonly comandHandler: CommandHandler
  ) {

  }

  async resolveMacroAndAlias(input: CommandOrMacro, resolveAlias: boolean, combDelay: number | undefined): Promise<void> {
    if ((input as MacroCommand).macro) {
      const executable = this.configService.getMacros()[(input as MacroCommand).macro];
      for (const command of executable.commands) {
        const preparedCommand = this.variableService.replacePlaceholders(
          command,
          (input as MacroCommand).variables,
          executable.variables
        );
        await this.resolveMacroAndAlias(preparedCommand, true, (preparedCommand.delay as number | undefined) ?? combDelay);
      }
      // and then await this delay before every command in macro, only on first iteration
      if (typeof input.delay === 'number' ) { // ignore if it's a variable or undefined
        await this.awaitDelay(input.delay as number, undefined); // if it's a macro, delay in this macro won't be passed down
        // but would be await after all commands in this macro as expected, this is why on top we are not passing it
      }
    } else if (resolveAlias) {
      const commands = this.resolveAliases(input as Command);
      for (const command of commands) {
        await this.resolveMacroAndAlias(command, false, combDelay);
      }
    } else {
      await this.runCommand(input as Command, combDelay);
    }
  }

  private async runCommand(input: Command, combDelay: undefined | number): Promise<void> {
    const currRec = this.variableService.replaceEnvVars(input);
    const ip = this.configService.getIps()[(currRec as Command).destination];
    this.logger.debug(`Running ${JSON.stringify(input)}`);
    await this.comandHandler.handle(ip, currRec);
    await this.awaitDelay(combDelay, input.delay as number | undefined);
  }

  private async awaitDelay(combDelay: undefined | number, commandDelay: undefined | number): Promise<void> {
    if (commandDelay !== undefined) {
      combDelay = commandDelay;
    }
    if (combDelay === undefined) {
      combDelay = Math.round(Math.random() * this.configService.getDelay());
    }
    await new Promise(resolve => {
      setTimeout(resolve, combDelay);
    });
  }

  resolveAliases(rec: Command): Command[] {
    if (this.configService.getIps()[rec.destination]) {
      return [{...rec, destination: rec.destination}];
    }
    const destination = this.configService.getAliases()[rec.destination];
    if (typeof destination === 'string') {
      return this.resolveAliases({...rec, destination});
    }
    if (Array.isArray(destination)) {
      return destination.flatMap(dest => this.resolveAliases({...rec, destination: dest}));
    }
    throw Error(`Unknown destination ${rec.destination}`);
  }
}
