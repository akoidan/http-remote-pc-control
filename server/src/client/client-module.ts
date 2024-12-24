import {
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { FetchClient } from '@/client/http-client';
import { ClientService } from '@/client/client-service';

@Module({
  providers: [
    Logger,
    {
      provide: FetchClient,
      useFactory: (logger) => new FetchClient(logger, "http", 5000),
      inject: [Logger]
    },
    ClientService
  ],
  exports: [ClientService]
})
export class ClientModule {
}
