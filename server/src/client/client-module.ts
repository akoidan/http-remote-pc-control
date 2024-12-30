import {
  Logger,
  Module,
} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {CertService} from '@/client/cert-service';


@Module({
  providers: [
    Logger,
    CertService,
    {
      provide: FetchClient,
      useFactory: async(logger: Logger, cert: CertService): Promise<FetchClient> => new FetchClient(logger, await cert.getHttpAgent(), 'https:', 5000),
      inject: [Logger, CertService],
    },
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
