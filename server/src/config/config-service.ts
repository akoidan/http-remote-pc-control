import {
  aARootSchema,
  AliasesData,
  ConfigData,
  IpsData,
  macrosDefinitionSchema,
  variablesSchema,
} from '@/config/types/schema';
import {parse} from 'jsonc-parser';
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {promises as fs} from 'fs';
import {schemaRootCache} from '@/config/types/cache';
import {Variables} from '@/config/types/variables';
import {MacroList} from '@/config/types/macros';
import {ShortsData} from '@/config/types/shortcut';
import {ConfigProvider} from '@/config/interfaces';

interface ConfigCombination {
  shortCut: string;
  name: string;
}

@Injectable()
export class ConfigService implements ConfigProvider {
  private configData: ConfigData | null = null;

  private variables: Variables = {};

  private variablesSaveLock: Promise<any> | null = null;
  private variablesSaveLockIteration: number = 1;

  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly configFilePath: string,
    private readonly macroFilePath: string,
    private readonly variablesFilePath: string,
    private readonly logger: Logger,
    private readonly envVars: Record<string, string | undefined>,
  ) {
  }

  public async parseConfig(): Promise<void> {
    this.logger.log('parsing config');
    if (this.configData) {
      throw new Error('Config already loaded');
    }
    const configValue = await this.loadConfigString();
    const macroConfigValue = await this.loadMacroConfigString();
    const variablesConfigValue = await this.loadVariablesConfigString();

    const conf = parse(configValue) as ConfigData;
    const globalMacroConf = macroConfigValue ? parse(macroConfigValue) as MacroList : {};

    this.variables = variablesConfigValue ? parse(variablesConfigValue) as Variables : {};

    this.logger.debug('Validating global config');
    schemaRootCache.data = conf;
    schemaRootCache.macros = globalMacroConf;
    await macrosDefinitionSchema.parseAsync(globalMacroConf);

    this.logger.debug('Validating macro config');
    conf.macros = {...globalMacroConf, ...conf.macros};
    await aARootSchema.parseAsync(conf);

    this.logger.debug('Validating variables config');
    await variablesSchema.parseAsync(this.variables);

    const combinations = (conf.combinations as ShortsData[])
      .map((combination): ConfigCombination => ({
        shortCut: combination.shortCut,
        name: combination.name,
      }))
      .sort((a, b) => a.shortCut.localeCompare(b.shortCut));

    combinations.forEach((combination) => {
      this.logger.log(`${combination.shortCut}: ${combination.name}`);
    });

    this.configData = conf;
  }

  public async loadConfigString(): Promise<string> {
    this.logger.debug(`Loading config from ${this.configFilePath}`);
    return fs.readFile(this.configFilePath, 'utf8');
  }

  public async loadMacroConfigString(): Promise<string | null> {
    this.logger.debug(`Loading macro config from ${this.macroFilePath}`);
    try {
      return await fs.readFile(this.macroFilePath, 'utf8');
    } catch (error) {
      this.logger.warn(`Unable to load global macros from ${this.macroFilePath} because of ${error?.message ?? error}`);
      return null;
    }
  }

  public async loadVariablesConfigString(): Promise<string | null> {
    this.logger.debug(`Loading variable config from ${this.variablesFilePath}`);
    try {
      return await fs.readFile(this.variablesFilePath, 'utf8');
    } catch (error) {
      this.logger.warn(`Unable to load global macros from ${this.variablesFilePath} because of ${error?.message ?? error}`);
      return null;
    }
  }

  public getIps(): IpsData {
    return this.configData!.ips;
  }

  public getCombinations(): ShortsData[] {
    return this.configData!.combinations;
  }

  public getAliases(): NonNullable<AliasesData> {
    return this.configData!.aliases ?? {};
  }

  public getMacros(): NonNullable<MacroList> {
    return this.configData!.macros ?? {};
  }

  public getDelay(): number {
    return this.configData!.delay;
  }

  public getVariables(): NonNullable<Variables> {
    return this.variables;
  }

  public async setVariable(name: string, value: string | number): Promise<void> {
    this.variables[name] = value;
    this.variablesSaveLockIteration++;
    const iteration = this.variablesSaveLockIteration;
    if (this.variablesSaveLock) {
      this.logger.debug(`Save variables #${iteration}. Awaiting lock release`);
      await this.variablesSaveLock;
      this.logger.debug(`Save variables #${iteration}. Locked release`);
    } else {
      this.logger.debug(`Save variables #${iteration}. Lock doesn't exist. Commiting to main thread`);
    }
    if (iteration !== this.variablesSaveLockIteration) {
      this.logger.debug(`Save variables #${iteration}. Dropping current iteration to save variable for more prior one`);
      return;
    }
    this.logger.debug(`Save variables #${iteration}. Caching new variables to file ${this.variablesFilePath}`);
    let resolve: (a?: unknown)=> void = null!;
    this.variablesSaveLock = new Promise(r => {
      resolve = r;
    });
    await fs.writeFile(this.variablesFilePath, JSON.stringify(this.variables, null, 2));
    this.logger.debug(`Save variables #${iteration}. Iteration finished, releasing lock`);
    this.variablesSaveLock = null;
    resolve();
  }

  public getGlobalVars(): Record<string, string | undefined> {
    return this.envVars;
  }
}
