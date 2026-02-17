import {Logger, Module} from '@nestjs/common';

@Module({
  providers: [CertificatesModule, Logger],
})
export class CertificatesModule {
}
