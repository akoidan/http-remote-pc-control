import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {VariablesDefinition} from '@/config/types/macros';
import { variableRegex } from '@/config/types/variables';

@Injectable()
export class VariableResolutionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
  }

  replacePlaceholders<T extends object>(command: T, values: Record<string, unknown> | undefined, definition: VariablesDefinition): T {
    if (!values) {
      return command;
    }

    const result: Partial<T> = {};
    for (const [commandKey, commandValueForKey] of Object.entries(command) as [keyof T, T[keyof T]][]) {
      if (typeof commandValueForKey === 'string' && variableRegex.test(commandValueForKey)) {
        const varName = commandValueForKey.slice(2, -2);
        if (definition[varName]) {
          if (values[varName]) {
            result[commandKey] = values[varName] as any;
            this.logger.debug(`Replaced  variable ${varName} for command  ${JSON.stringify(command)} to ${values[varName]}`);
          } else if (!definition[varName]!.optional) {
            throw Error(`Unable to resolve macros variable${commandValueForKey} when running ${JSON.stringify(command)}`);
          } else {
            this.logger.debug(`Omitting variable ${varName} from ${JSON.stringify(command)} since it's optional`);
          }
        } else {
          result[commandKey] = commandValueForKey;
        }
      } else if (commandKey === 'variables' && typeof commandValueForKey === 'object') {
        result[commandKey] = {...commandValueForKey};
        for (const [innerCommand, innerCommandValueForKey] of Object.entries(commandValueForKey as object)) {
          if (typeof innerCommandValueForKey === 'string' && variableRegex.test(innerCommandValueForKey)) {
            const varName = innerCommandValueForKey.slice(2, -2);
            if (values[varName]) {
              (result[commandKey] as any)[innerCommand] = values[varName] as any;
              this.logger.debug(`Replaced  variable ${varName} for command  ${JSON.stringify(command)} to ${values[varName]}`);
            } else {
              throw Error(`Unable to resolve macros variable${innerCommandValueForKey} when running ${JSON.stringify(command)}`);
            }
          }
        }
      } else {
        result[commandKey] = commandValueForKey;
      }
    }
    return result as T;
  }

  replaceEnvVars<T extends object>(obj: T): T {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      if (typeof value === 'string' && variableRegex.test(value)) {
        const globalVars = this.configService.getGlobalVars();
        const scriptVars = this.configService.getVariables();
        const varName = value.slice(2, -2);

        if (scriptVars[varName]) {
          result[key] = scriptVars[varName] as T[keyof T];
        } else if (globalVars[varName]) {
          result[key] = globalVars[varName] as T[keyof T];
        } else {
          throw Error(`Unknown environment variable ${value}`);
        }
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
}
