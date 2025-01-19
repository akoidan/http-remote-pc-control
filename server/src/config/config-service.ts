import {
  aARootSchema,
  Aliases,
  ConfigData,
  EventData,
  Ips,
  MacroList,
  macrosMapSchema,
  Variables,
} from '@/config/types/schema';
import {parse} from 'jsonc-parser';
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {promises as fs} from 'fs';

interface ConfigCombination {
  shortCut: string;
  name: string;
}

@Injectable()
export class ConfigService {
  private configData: ConfigData | null = null;

  constructor(
    private readonly configFilePath: string,
    private readonly macroFilePath: string,
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
    const conf = parse(configValue) as ConfigData;
    const globalMacroConf = macroConfigValue ? parse(macroConfigValue) as MacroList : {};

    this.logger.debug('Validating global config');
    await macrosMapSchema.parseAsync(globalMacroConf);

    this.logger.debug('Validating macro config');
    conf.macros = {...globalMacroConf, ...conf.macros};
    await aARootSchema.parseAsync(conf);

    const combinations = (conf.combinations as EventData[])
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

  public getIps(): Ips {
    return this.configData!.ips;
  }

  public getCombinations(): EventData[] {
    return this.configData!.combinations;
  }

  public getAliases(): NonNullable<Aliases> {
    return this.configData!.aliases ?? {};
  }

  public getMacros(): NonNullable<MacroList> {
    return this.configData!.macros ?? {};
  }

  public getDelay(): number {
    return this.configData!.delay;
  }

  public getVariables(): NonNullable<Variables> {
    return this.configData!.variables ?? {};
  }

  public getGlobalVars(): Record<string, string | undefined> {
    return this.envVars;
  }
}
