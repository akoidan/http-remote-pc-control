import {Global, Inject, Logger, Module, type OnModuleInit} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';
import bindings from 'bindings';
import clc from 'cli-color';
import os from 'os';

@Global()
@Module({
  providers: [
    Logger,
    {
      provide: Native,
      useFactory: (): INativeModule => {
        // eslint-disable-next-line
        return bindings('native');
      },
    },
  ],
  exports: [Native],
})
export class NativeModule implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly native: INativeModule
  ) {
  }

  onModuleInit(): any {
    if (os.platform() === 'win32' && !this.native.isProcessElevated()) {
      throw Error('Current process have to be run as administrator. ' +
        'Some api might be also available only from admin powershell and they wont work from m2-> run as admin or admin cmd');
    }
    this.logger.log(`Loaded native library from ${clc.bold.green(this.native.path)}`);
  }
}
