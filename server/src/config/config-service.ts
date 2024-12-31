import {
  Aliases,
  ConfigData,
  EventData,
  rootSchema,
  Ips,
  MacroList,
} from '@/config/types/schema';
import {parse} from 'jsonc-parser';
import {
  Injectable,
  Logger,
} from '@nestjs/common';

interface ConfigCombination {
  shortCut: string;
  name: string;
}

@Injectable()
export class ConfigService {
  private configData: ConfigData | null = null;

  constructor(
    private readonly jsoncConfigData: string,
    private readonly logger: Logger,
    private readonly envVars: Record<string, string|undefined>,
  ) {}

  public async parseConfig(): Promise<void> {
    this.logger.log('parsing config');
    if (this.configData) {
      throw new Error('Config already loaded');
    }
    const conf = parse(this.jsoncConfigData) as ConfigData;
    await rootSchema.parseAsync(conf);

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

  public getIps(): Ips {
    return this.configData!.ips;
  }

  public getCombinations(): EventData[] {
    return this.configData!.combinations;
  }

  public getAliases(): Aliases {
    return this.configData!.aliases ?? {};
  }

  public getMacros(): MacroList {
    return this.configData!.macros ?? {};
  }

  public getDelay(): number {
    return this.configData!.delay;
  }

  public getGlobalVars(): Record<string, string|undefined> {
    return this.envVars;
  }
}
