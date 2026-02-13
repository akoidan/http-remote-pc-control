import {Global, Inject, Logger, Module, type OnModuleInit} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';
import clc from 'cli-color';
import os from 'os';
import {getAsset, isSea} from 'node:sea';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {writeFile, mkdtemp} from 'node:fs/promises';

@Global()
@Module({
  providers: [
    Logger,
    {
      provide: Native,
      useFactory: async(): Promise<INativeModule> => {
        if (isSea()) {
          const tmp = await mkdtemp(join(tmpdir(), 'sea-'));
          const pathOnDisk = join(tmp, 'native.node');
          await writeFile(pathOnDisk, Buffer.from(getAsset('native')));
          const requireFromHere = createRequire(__filename);
          // eslint-disable-next-line
          return requireFromHere(pathOnDisk) as INativeModule;
        }
        // eslint-disable-next-line
        const bindings = require('bindings') as any;
        // eslint-disable-next-line
        return bindings('native') as INativeModule;
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
