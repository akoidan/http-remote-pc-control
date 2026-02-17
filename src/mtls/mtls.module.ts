import {DynamicModule, Logger, Module} from '@nestjs/common';
import {CertService} from '@/mtls/cert-service';
import {CERT_DIR} from '@/mtls/mtls-model';
import {TlsService} from '@/mtls/tls-service';

@Module({
  providers: [CertService, Logger, TlsService],
  exports: [CertService],
})
export class MtlsModule {
  static forRoot(certDir: string): DynamicModule {
    return {
      module: MtlsModule,
      providers: [
        {
          provide: CERT_DIR,
          useValue: certDir,
        },
      ],
    };
  }
}
