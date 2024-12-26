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
      useFactory: async() => {
        return fs.readFile(
          path.join(__dirname, 'private_key.pem'),
          'utf8',
        );
      },
    },
    {
      provide: JwtService,
      useFactory: async(logger, key) => new JwtService(logger, key),
      inject: [Logger, 'JWT_PRIVATE_KEY'],
    },
    {
      provide: FetchClient,
      useFactory: (logger, jwt) => new FetchClient(logger, jwt, 'http', 5000),
      inject: [Logger, JwtService],
    },
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
