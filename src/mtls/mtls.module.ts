import {
  DynamicModule,
  Logger,
  Module,
} from '@nestjs/common';
import {CertService} from '@/mtls/cert-service';

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
          provide: 'CERT_DIR', useValue: certDir,
        },
      ],
    };
  }
}
