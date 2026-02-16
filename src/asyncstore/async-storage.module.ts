import {Module} from '@nestjs/common';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';

@Module({
  providers: [{
    provide: ASYNC_PROVIDER,
    useValue: asyncLocalStorage,
  }],
  exports: [ASYNC_PROVIDER],
})
export class AsyncStorageModule {
}
