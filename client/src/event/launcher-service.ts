import { Injectable } from '@nestjs/common';

import { spawn } from 'child_process';
import {
  InjectPinoLogger,
  PinoLogger
} from 'nestjs-pino';

@Injectable()
export class LauncherService {

  constructor(
    @InjectPinoLogger(LauncherService.name)
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
}



