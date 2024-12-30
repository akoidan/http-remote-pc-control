import {Module} from '@nestjs/common';
import {CertService} from '@/mtls/cert-service';
import {LoggerModule} from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'debug', // Global log level
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            levelFirst: false,
            messageFormat: '\u001b[36m{reqId}\u001b[39m: \u001b[38;5;237m{msg}\u001b[39m',
            translateTime: 'HH:MM:ss.l',
            ignore: 'context',
            destination: 1, // stdout
          },
        },
      },
    }),
  ],
  providers: [
    CertService,
  ],
  exports: [CertService],
})
export class MtlsModule {
}
