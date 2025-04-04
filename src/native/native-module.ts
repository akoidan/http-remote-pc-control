import {
  Global,
  Module,
} from '@nestjs/common';
import {
  INativeModule,
  Native,
} from '@/native/native-model';
import bindings from 'bindings';

@Global()
@Module({
  providers: [
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
export class NativeModule {
}
