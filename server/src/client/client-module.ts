import {
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { FetchClient } from '@/client/http-client';
import { ClientService } from '@/client/client-service';

@Module({
  providers: [
    ClientService, {
      provide: FetchClient,
      useValue: new FetchClient("http", 5000)
    }],
  exports: [ClientService]
})
export class ClientModule {
}
