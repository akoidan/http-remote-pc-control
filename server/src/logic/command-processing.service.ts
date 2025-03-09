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
import {CircularIndex} from '@/logic/circular-index';

@Injectable()
export class CommandProcessingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly variableService: VariableResolutionService,
    private readonly logger: Logger,
    private readonly comandHandler: CommandHandler,
    private readonly circularResolved: CircularIndex,
  ) {

  }

  async resolveMacroAndAlias(
    input: CommandOrMacro,
    resolveAlias: boolean,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined
  ): Promise<void> {
    if ((input as MacroCommand).macro) {
      const executable = this.configService.getMacros()[(input as MacroCommand).macro];
      if (typeof input.delayBefore === 'number') { // ignore if it's a variable or undefined
        // if it's a macro, delay in this macro won't be passed down
        // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
        await this.awaitDelay(input.delayBefore as number, undefined, this.configService.getDelayBefore());
      }
      for (const command of executable.commands) {
        const preparedCommand = this.variableService.replacePlaceholders(
          command,
          (input as MacroCommand).variables,
          executable.variables
        );
        const delayA = (preparedCommand.delayAfter as number | undefined) ?? combDelayAfter;
        const delayB = (preparedCommand.delayBefore as number | undefined) ?? combDelayBefore;
        await this.resolveMacroAndAlias(preparedCommand, true, delayA, delayB);
      }
      // commands in this macro has been already ran in the loop
      // await delay before the next command after this macro runs
      if (typeof input.delayAfter === 'number') { // ignore if it's a variable or undefined
        await this.awaitDelay(input.delayAfter as number, undefined, this.configService.getDelayAfter()); // if it's a macro, delay in this macro won't be passed down
        // but would be await after all commands in this macro as expected, this is why on top we are not passing it
      }
    } else if (resolveAlias) {
      const commands = this.resolveAliases(input as Command);
      for (const command of commands) {
        await this.resolveMacroAndAlias(command, false, combDelayAfter, combDelayBefore);
      }
    } else {
      await this.runCommand(input as Command, combDelayAfter, combDelayBefore);
    }
  }

  private async runCommand(input: Command, combDelayAfter: undefined | number, combDelayBefore: undefined | number): Promise<void> {
    const currRec = this.variableService.replaceEnvVars(input);
    this.logger.debug(`Running ${JSON.stringify(input)}`);
    await this.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, this.configService.getDelayBefore());
    await this.comandHandler.handle((currRec as Command).destination, currRec);
    await this.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, this.configService.getDelayAfter());
  }

  private async awaitDelay(
    combDelay: undefined | number,
    commandDelay: undefined | number,
    configDelay: number | undefined
  ): Promise<void> {
    if (commandDelay !== undefined) {
      combDelay = commandDelay;
    }
    if (combDelay === undefined && configDelay !== undefined) {
      combDelay = Math.round(Math.random() * configDelay);
    }
    if (combDelay) {
      await new Promise(resolve => {
        setTimeout(resolve, combDelay);
      });
    }
  }

  resolveAliases(rec: Command): Command[] {
    if (this.configService.getIps()[rec.destination]) {
      return [{...rec, destination: rec.destination}];
    }
    const destination = this.configService.getAliases()[rec.destination];
    if (typeof destination === 'string') {
      return this.resolveAliases({...rec, destination});
    }
    if (typeof destination === 'object') {
      const commands = destination.ipNames.flatMap(dest => this.resolveAliases({...rec, destination: dest}));
      if (destination.circular) {
        return [this.circularResolved.getNextFighterIndex(rec, commands)];
      }
      return commands;
    }
    throw Error(`Unknown destination ${rec.destination}`);
  }
}
