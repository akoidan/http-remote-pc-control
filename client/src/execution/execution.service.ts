import {Injectable} from '@nestjs/common';
import os from 'os';
import {exec, spawn} from 'child_process';
import {promisify} from 'util';
import {InjectPinoLogger, PinoLogger} from 'nestjs-pino';

@Injectable()
export class ExecutionService {

  constructor(
    @InjectPinoLogger(ExecutionService.name)
    private readonly logger: PinoLogger
  ) {
  }

  async launchExe(pathToExe: string): Promise<void> {
    this.logger.info(`Launching ${pathToExe}`);
    const gameProcess = spawn(pathToExe, [], {
      detached: true, // Run independently from parent process
      stdio: 'ignore' // Ignore console output
    });
    // Detach and allow process to continue running even after the script exits
    gameProcess.unref();
  }

  async killExe(name: string): Promise<boolean> {
    this.logger.info(`debug ${name}`);
    const platform = os.platform(); // Detect OS
    let command: string;

    // Determine the command based on OS
    if (platform === 'win32') {
      command = `taskkill /IM ${name} /F`; // Windows
    } else if (platform === 'linux' || platform === 'darwin') {
      command = `pkill -9 ${name}`; // Linux and macOS
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    try {
      const { stdout, stderr } = await promisify(exec)(command);
      this.logger.info(`Process "${name}" killed successfully:`, stdout || stderr);
      return true;
    } catch (e) {
      if (e.message.includes(`process "${name}" not found`)) {
        this.logger.info(`Process "${name}" is not up. Skipping it`);
        return false;
      }
      throw e;
    }
  }
}



