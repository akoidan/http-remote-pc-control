import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotImplementedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import os from 'os';
import {
  exec,
  spawn,
} from 'child_process';
import {promisify} from 'util';

@Injectable()
export class ExecutionService {
  constructor(
    private readonly logger: Logger
  ) {
  }

  async launchExe(pathToExe: string, args: string[], waitTillFinish: boolean): Promise<number> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Launching: \u001b[35m${pathToExe} ${args.join(' ')}`);

      try {
        const process = spawn(pathToExe, args, {
          detached: true, // Run independently from parent process
          stdio: 'ignore', // Ignore console output
        });

        // Handle immediate errors (e.g., file not found, no permissions)
        process.on('error', (err) => {
          this.logger.error(`Failed to launch process: ${err.message}`);
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(new ServiceUnavailableException(`Failed to start process: ${err.message}`) as any);
        });

        // Detect if the process exits quickly after starting
        const startupTimeout = setTimeout(() => {
          this.logger.debug(`Process started successfully: ${pathToExe}`);
          resolve(process.pid!); // Resolve only after some time has passed without errors
        }, waitTillFinish ? 60_000 : 300);

        process.on('close', (code) => {
          clearTimeout(startupTimeout); // Clear timeout if process exits
          if (code === 0) {
            resolve(process.pid!);
          } else {
            reject(new ServiceUnavailableException(`Process exit with code ${code}`));
          }
        });

        // Detach and allow process to run independently
        process.unref();
      } catch (e) {
        reject(new ServiceUnavailableException(`${pathToExe} ${args.join(' ')} failed with: ${e.message}`, (e as Error).stack));
      }
    });
  }

  async killExe(name: string): Promise<boolean> {
    this.logger.log(`Kill ${name}`);
    const platform = os.platform(); // Detect OS
    let command: string;

    // Determine the command based on OS
    if (platform === 'win32') {
      command = `taskkill /IM ${name} /F`; // Windows
    } else if (platform === 'linux' || platform === 'darwin') {
      command = `pkill -9 ${name}`; // Linux and macOS
    } else {
      throw new NotImplementedException(`Unsupported platform: ${platform}`);
    }
    try {
      const {stdout, stderr} = await promisify(exec)(command);
      this.logger.debug(`Process "${name}" killed successfully:`, stdout || stderr);
      return true;
    } catch (e) {
      if ((platform === 'win32' && e?.message.includes(`process "${name}" not found`))
        || (platform === 'linux' && e?.code === 1)) {
        this.logger.debug(`Process "${name}" is not up. Skipping it`);
        return false;
      }
      throw new InternalServerErrorException(e);
    }
  }
}



