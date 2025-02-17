import {Injectable} from '@nestjs/common';
import path from 'path';


@Injectable()
export class ConfigsPathService {
  public get configDir():string {
    const isNodeJs = process.execPath.endsWith('node') || process.execPath.endsWith('node.exe');
    const configDirs =  isNodeJs ? process.cwd() : path.dirname(process.execPath);
    return path.join(configDirs, 'configs');
  }

  public get configFilePath(): string {
    return path.join(this.configDir, 'config.jsonc');
  }

  public get macroFilePath(): string {
    return path.join(this.configDir, 'macros.jsonc');
  }

  public get variablesFilePath(): string {
    return path.join(this.configDir, 'variables.jsonc');
  }
}
