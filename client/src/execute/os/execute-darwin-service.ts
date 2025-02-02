import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {exec} from 'child_process';
import {promisify} from 'util';
import {IExecuteService} from '@/execute/execute-model';
import {LauncherService} from '@/execute/launcher-service';

@Injectable()
export class ExecuteDarwinService implements IExecuteService {
  constructor(
    private readonly logger: Logger,
    private readonly launcher: LauncherService
  ) {
  }

  async launchExe(pathToExe: string, args: string[], waitTillFinish: boolean): Promise<number> {
    return this.launcher.launchExe(pathToExe, args, waitTillFinish);
  }

  async killExe(name: string): Promise<boolean> {
    this.logger.log(`Kill ${name}`);
    try {
      const {stdout, stderr} = await promisify(exec)(`pkill -9 ${name}`);
      this.logger.debug(`Process "${name}" killed successfully:`, stdout || stderr);
      return true;
    } catch (e) {
      if (e?.code === 1) {
        this.logger.debug(`Process "${name}" is not up. Skipping it`);
        return false;
      }
      throw new InternalServerErrorException(e);
    }
  }
}




