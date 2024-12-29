import {Logger, Module} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {JwtService} from '@/client/jwt-service';
import {KeyService} from '@/client/keys-service';


@Module({
  providers: [
    Logger,
    KeyService,
    JwtService,
    {
      provide: FetchClient,
      useFactory: (logger: Logger, jwt: JwtService): FetchClient => new FetchClient(logger, jwt, 'http', 5000),
      inject: [Logger, JwtService],
    },
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
