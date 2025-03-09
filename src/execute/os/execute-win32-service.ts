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
export class ExecuteWin32Service implements IExecuteService {
  constructor(
    private readonly logger: Logger,
    private readonly launcher: LauncherService
  ) {
  }

  async launchExe(pathToExe: string, args: string[], waitTillFinish: boolean): Promise<number> {
    return this.launcher.launchExe(pathToExe, args, waitTillFinish);
  }

  async killExeByName(name: string): Promise<boolean> {
    this.logger.log(`Kill ${name}`);

    try {
      const {stdout, stderr} = await promisify(exec)(`taskkill /IM ${name} /F`);
      this.logger.debug(`Process "${name}" killed successfully:`, stdout || stderr);
      return true;
    } catch (e) {
      if (e?.message.includes(`process "${name}" not found`)) {
        this.logger.debug(`Process "${name}" is not up. Skipping it`);
        return false;
      }
      throw new InternalServerErrorException(e);
    }
  }

  async killExeByPid(pid: number): Promise<boolean> {
    this.logger.log(`Kill ${pid}`);

    try {
      const {stdout, stderr} = await promisify(exec)(`taskkill /PID ${pid} /F`);
      this.logger.debug(`Process "${pid}" killed successfully:`, stdout || stderr);
      return true;
    } catch (e) {
      if (e?.message.includes(`process "${pid}" not found`)) {
        this.logger.debug(`Process "${pid}" is not up. Skipping it`);
        return false;
      }
      throw new InternalServerErrorException(e);
    }
  }
}



