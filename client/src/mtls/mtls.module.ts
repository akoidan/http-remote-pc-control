import {Module} from '@nestjs/common';
import {CertService} from '@/mtls/cert-service';
import {CustomLoggerModule} from '@/logger/custom-logger-module';

@Module({
  imports: [
    CustomLoggerModule,
  ],
  providers: [
    CertService,
  ],
  exports: [CertService],
})
export class MtlsModule {
}
