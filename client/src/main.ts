import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app/app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { MtlsModule } from '@/mtls/mtls.module';
import { CertService } from '@/mtls/cert-service';

async function bootstrap(): Promise<void> {
  const mtls = await NestFactory.create(MtlsModule);
  const certs = mtls.get(CertService);
  await certs.checkFilesExist();
  const [key, cert, ca] = await Promise.all([certs.getPrivateKey(), certs.getCert(), certs.getCaCert()]);
  await mtls.close();
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    httpsOptions: {
      key,
      cert,
      ca,
      requestCert: true,
      rejectUnauthorized: true,
    },
  });
  // app.useGlobalPipes(new ValidationPipe());
  // app.useLogger(app.get(Logger));
  // await app.listen(5000);
}

bootstrap().catch((e: unknown) => {
  console.error(e); // eslint-disable-line no-console
  process.exit(98); // force electron to close
});
