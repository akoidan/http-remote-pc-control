import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {
  MacroCommand,
  VariablesDefinition,
} from '@/config/types/macros';
import {extractVariableName} from '@/config/types/variables';

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
    for (const [key, value] of Object.entries(command) as [keyof T, T[keyof T]][]) {
      if ((command as MacroCommand).variables && key === 'variables') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        result[key] = this.handleVariablesObject(value as VariablesDefinition, values) as any;
      } else {
        const varName = extractVariableName(value)!;
        if (!definition[varName]) {
          result[key] = value;
        } else if (values[varName]) {
          this.logger.debug(`Replaced variable ${varName}  to ${values[varName] as string}`);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          result[key] = values[varName] as any;
        } else if (definition[varName]!.optional) {
          this.logger.debug(`Omitting variable ${varName} from ${JSON.stringify(command)} since it's optional`);
        } else {
          throw Error(`Unable to resolve macros variable ${varName} when running ${JSON.stringify(command)}`);
        }
      }
    }

    return result as T;
  }

  private handleVariablesObject(
    variables: VariablesDefinition,
    values: Record<string, unknown>
  ): VariablesDefinition {
    const result: VariablesDefinition = {...variables};
    for (const [key, value] of Object.entries(variables)) {
      const varName = extractVariableName(value);
      if (varName) {
        if (!values[varName]) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw Error(`Unable to resolve macros variable ${value}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        result[key] = values[varName] as any;
      }
    }
    return result;
  }

  replaceEnvVars<T extends object>(obj: T): T {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      const varName = extractVariableName(value);
      if (varName) {
        const globalVars = this.configService.getGlobalVars();
        const scriptVars = this.configService.getVariables();
        if (scriptVars[varName]) {
          result[key] = scriptVars[varName] as T[keyof T];
        } else if (globalVars[varName]) {
          result[key] = globalVars[varName] as T[keyof T];
        } else {
          throw Error(`Unknown environment variable ${value as string}`);
        }
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
}
