import {
  Logger,
  Module,
} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {CertService} from '@/client/cert-service';
import {ConfigModule} from '@/config/config-module';
import { ConfigService } from '@/config/config-service';


@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    Logger,
    CertService,
    {
      provide: FetchClient,
      async useFactory(logger: Logger, cert: CertService, config: ConfigService): Promise<FetchClient> {
        return new FetchClient(logger, config, await cert.getHttpAgent(), 'https:', 5000);
      },
      inject: [Logger, CertService, ConfigService],
    },
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
