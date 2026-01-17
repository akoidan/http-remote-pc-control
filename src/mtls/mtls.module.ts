import {DynamicModule, Logger, Module} from '@nestjs/common';
import {CertService} from '@/mtls/cert-service';
import {CERT_DIR} from '@/mtls/mtls-model';

@Module({
  providers: [CertService, Logger],
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
