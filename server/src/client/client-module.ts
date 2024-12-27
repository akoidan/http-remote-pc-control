import {
  Logger,
  Module,
} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {JwtService} from '@/client/jwt-service';
import {promises as fs} from 'fs';
import * as path from 'path';

@Module({
  providers: [
    Logger,
    {
      provide: 'JWT_PRIVATE_KEY',
      useFactory: async(): Promise<string> => {
        return fs.readFile(
          path.join(__dirname, 'private_key.pem'),
          'utf8',
        );
      },
    },
    {
      provide: JwtService,
      useFactory: (logger: Logger, key: string): JwtService => new JwtService(logger, key),
      inject: [Logger, 'JWT_PRIVATE_KEY'],
    },
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
