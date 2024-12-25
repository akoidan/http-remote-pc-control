import {
  Aliases,
  ConfigData,
  EventData,
  fullSchema,
  Ips,
  MacroList
} from '@/config/types';
import { parse } from 'jsonc-parser';
import {
  Injectable,
  Logger
} from '@nestjs/common';

@Injectable()
export class ConfigService {

  private configData: ConfigData | null = null;

  constructor(private jsoncConfigData: string, private readonly logger: Logger) {
  }

  public async parseConfig(): Promise<void> {
    this.logger.log("parsing config");
    if (this.configData) {
      throw Error('Config already loaded');
    }
    const conf = parse(this.jsoncConfigData);
    await fullSchema.parseAsync(conf);
    conf.combinations.map((c: any) => ({
      shortCut: c.shortCut,
      name: c.name,
    })).sort((a: any, b: any) => a.shortCut.localeCompare(b.shortCut)).forEach((c: any) => {
      this.logger.log(`${c.shortCut}: ${c.name}`)
    });
    this.configData = conf;
  }

  public getIps(): Ips {
    if (!this.configData) {
      throw Error('Config not loaded');
    }
    return this.configData.ips;
  }

 public getCombinations(): EventData[] {
    if (!this.configData) {
      throw Error('Config not loaded');
    }
    return this.configData.combinations;
  }

  public getAliases(): Aliases {
    if (!this.configData) {
      throw Error('Config not loaded');
    }
    return this.configData.aliases;
  }

  public getMacros(): MacroList {
    if (!this.configData) {
      throw Error('Config not loaded');
    }
    return this.configData.macros;
  }

  public getDelay(): number{
    if (!this.configData) {
      throw Error('Config not loaded');
    }
    return this.configData.delay;
  }
}
