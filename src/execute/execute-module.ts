import {
  Logger,
  Module,
  NotImplementedException,
} from '@nestjs/common';
import {ExecuteController} from '@/execute/execute-controller';
import {
  ExecuteService,
  IExecuteService,
} from '@/execute/execute-model';
import {ExecuteLinuxService} from '@/execute/os/execute-linux-service';
import {ExecuteWin32Service} from '@/execute/os/execute-win32-service';
import {ExecuteDarwinService} from '@/execute/os/execute-darwin-service';
import os from 'os';
import {LauncherService} from '@/execute/launcher-service';

@Module({
  controllers: [ExecuteController],
  providers: [
    Logger,
    LauncherService,
    {
      provide: ExecuteService,
      inject: [Logger, LauncherService],
      useFactory: (logger: Logger, launcher: LauncherService): IExecuteService => {
        const platform = os.platform();
        if (platform === 'win32') {
          return new ExecuteWin32Service(logger, launcher);
        } else if (platform === 'linux') {
          return new ExecuteLinuxService(logger, launcher);
        } else if (platform === 'darwin') {
          return new ExecuteDarwinService(logger, launcher);
        }
        throw new NotImplementedException(`Unsupported platform: ${platform}`);
      },
    },
  ],
})
export class ExecuteModule {
}
