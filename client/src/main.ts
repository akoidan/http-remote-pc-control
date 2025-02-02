import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {MtlsModule} from '@/mtls/mtls.module';
import {CertService} from '@/mtls/cert-service';
import {
  asyncLocalStorage,
  CustomLogger,
} from '@/app/custom-logger';
import process from 'node:process';

asyncLocalStorage.run(new Map<string, string>().set('comb', 'init'), () => {
  const customLogger = new CustomLogger();
  (async function startApp(): Promise<void> {
    const logger = new CustomLogger();
    const mtls = await NestFactory.create(MtlsModule, {
      logger,
    });
    const certs = mtls.get(CertService);
    await certs.checkFilesExist();
    const [key, cert, ca] = await Promise.all([certs.getPrivateKey(), certs.getCert(), certs.getCaCert()]);
    await mtls.close();
    const app = await NestFactory.create(AppModule, {
      logger,
      httpsOptions: {
        key,
        cert,
        ca,
        requestCert: true,
        rejectUnauthorized: true,
      },
    });
    await app.listen(5000);
  })().catch((err: unknown) => {
    customLogger.error(err as string|Error);
    process.exit(98);
  });
});
