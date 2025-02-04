import {Injectable} from '@nestjs/common';
import path from 'path';


@Injectable()
export class ConfigsPathService {
  public get configDir():string {
    // eslint-disable-next-line max-len
    const isNodeJs = process.execPath.endsWith('node') || process.execPath.endsWith('node.exe');
    return isNodeJs ? process.cwd() : path.dirname(process.execPath);
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
