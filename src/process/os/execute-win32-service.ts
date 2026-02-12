import {BadRequestException, Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {exec} from 'child_process';
import {promisify} from 'util';
import {IExecuteService} from '@/process/process-model';
import {LauncherService} from '@/process/launcher-service';
import {LaunchExeRequest} from '@/process/process-dto';

@Injectable()
export class ExecuteWin32Service implements IExecuteService {
  constructor(
    private readonly logger: Logger,
    private readonly launcher: LauncherService
  ) {
  }

  async launchExe(data: LaunchExeRequest): Promise<number> {
    return this.launcher.launchExe(data);
  }

  async killExeByName(name: string): Promise<void> {
    this.logger.log(`Kill ${name}`);

    try {
      const {stdout, stderr} = await promisify(exec)(`taskkill /IM ${name} /F`);
      this.logger.debug(`Process "${name}" killed successfully:`, stdout || stderr);
    } catch (e) {
      if (e?.message.includes(`process "${name}" not found`)) {
        throw new BadRequestException(`Unable to kill "${name}" since it's not found`);
      }
      throw new InternalServerErrorException(e);
    }
  }

  async findPidByName(name: string): Promise<number[]> {
    this.logger.debug(`Executing: PowerShell to find PID of ${name}`);

    const command = `powershell -Command "Get-Process | Where-Object { $_.ProcessName -like '*${name}*' } | Select-Object -ExpandProperty Id"`;

    const {stdout, stderr} = await promisify(exec)(command);
    this.logger.debug(`Process "${name}" returned`, stdout || stderr);

    return stdout
      .split(/\r?\n/u)
      .map(line => line.trim())
      .filter(line => /^\d+$/u.test(line))
      .map(pid => parseInt(pid, 10));
  }


  async killExeByPid(pid: number): Promise<void> {
    this.logger.log(`Kill ${pid}`);

    try {
      const {stdout, stderr} = await promisify(exec)(`taskkill /PID ${pid} /F`);
      this.logger.debug(`Process "${pid}" killed successfully:`, stdout || stderr);
    } catch (e) {
      if (e?.message.includes(`process "${pid}" not found`)) {
        throw new BadRequestException(`Unable to kill pid "${pid}" since it's not found`);
      }
      throw new InternalServerErrorException(e);
    }
  }
}



