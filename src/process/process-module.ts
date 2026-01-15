import {Logger, Module, NotImplementedException} from '@nestjs/common';
import {ProcessController} from '@/process/process-controller';
import {ProcessService} from '@/process/process-service';
import {OS_INJECT} from '@/window/window-consts';
import os from 'os';
import {LauncherService} from '@/process/launcher-service';
import {ExecuteService, IExecuteService} from '@/process/process-model';
import {ExecuteWin32Service} from '@/process/os/execute-win32-service';
import {ExecuteLinuxDarwinService} from '@/process/os/execute-linux-darwin-service';

@Module({
  controllers: [ProcessController],
  providers: [
    {
      provide: OS_INJECT,
      useFactory: os.platform,
    },
    LauncherService,
    {
      provide: ExecuteService,
      inject: [Logger, LauncherService],
      useFactory: (logger: Logger, launcher: LauncherService): IExecuteService => {
        const platform = os.platform();
        if (platform === 'win32') {
          return new ExecuteWin32Service(logger, launcher);
        } else if (platform === 'linux' || platform === 'darwin') {
          return new ExecuteLinuxDarwinService(logger, launcher);
        }
        throw new NotImplementedException(`Unsupported platform: ${platform}`);
      },
    },
    Logger,
    ProcessService,
  ],
})
export class ProcessModule {
}
