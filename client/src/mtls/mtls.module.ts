import {
  Logger,
  Module,
} from '@nestjs/common';
import {CertService} from '@/mtls/cert-service';

@Module({
  providers: [CertService, Logger],
  exports: [CertService],
})
export class MtlsModule {
}
