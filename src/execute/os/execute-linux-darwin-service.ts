import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {exec} from 'child_process';
import {promisify} from 'util';
import {IExecuteService} from '@/execute/execute-model';
import {LauncherService} from '@/execute/launcher-service';

@Injectable()
export class ExecuteLinuxDarwinService implements IExecuteService {
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
      const {stdout, stderr} = await promisify(exec)(`pkill -9 '${name}'`);
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

  async findPidByName(name: string): Promise<number[]> {
    this.logger.debug(`Executing: pgrep -f ${name}`);
    const {stdout, stderr} = await promisify(exec)(`pgrep -f '${name}'`);
    this.logger.debug(`Process "${name}" returned`, stdout || stderr);
    return stdout
      .split(/\r?\n/u)
      .map(line => line.trim())
      .filter(line => /^\d+$/u.test(line))
      .map(pid => parseInt(pid, 10));
  }

  async killExeByPid(pid: number): Promise<boolean> {
    this.logger.log(`Kill ${pid}`);
    try {
      const {stdout, stderr} = await promisify(exec)(`kill -9 ${pid}`);
      this.logger.debug(`Process "${pid}" killed successfully:`, stdout || stderr);
      return true;
    } catch (e) {
      if (e?.code === 1) {
        this.logger.debug(`Process "${pid}" is not up. Skipping it`);
        return false;
      }
      throw new InternalServerErrorException(e);
    }
  }
}



