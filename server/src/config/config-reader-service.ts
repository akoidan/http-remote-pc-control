import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {promises as fs} from 'fs';
import {ConfigsPathService} from '@/config/configs-path.service';


@Injectable()
export class ConfigReaderService {
  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly logger: Logger,
    private readonly configsPathSerivice: ConfigsPathService,
  ) {
  }

  public async loadConfigString(): Promise<string> {
    this.logger.debug(`Loading config from ${this.configsPathSerivice.configFilePath}`);
    return fs.readFile(this.configsPathSerivice.configFilePath, 'utf8');
  }

  public async loadMacroConfigString(): Promise<string | null> {
    this.logger.debug(`Loading macro config from ${this.configsPathSerivice.macroFilePath}`);
    try {
      return await fs.readFile(this.configsPathSerivice.macroFilePath, 'utf8');
    } catch (error) {
      this.logger.warn(`Unable to load global macros from ${this.configsPathSerivice.macroFilePath} because of ${error?.message ?? error}`);
      return null;
    }
  }

  public async loadVariablesConfigString(): Promise<string | null> {
    this.logger.debug(`Loading variable config from ${this.configsPathSerivice.variablesFilePath}`);
    try {
      return await fs.readFile(this.configsPathSerivice.variablesFilePath, 'utf8');
    } catch (error) {
      // eslint-disable-next-line max-len
      this.logger.warn(`Unable to load global macros from ${this.configsPathSerivice.variablesFilePath} because of ${error?.message ?? error}`);
      return null;
    }
  }

  public async saveVariablesConfigString(variables: unknown): Promise<void> {
    await fs.writeFile(this.configsPathSerivice.variablesFilePath, JSON.stringify(variables, null, 2));
     this.logger.debug(`Save variables to ${this.configsPathSerivice.variablesFilePath}`);
  }
}
