import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {MtlsModule} from '@/mtls/mtls.module';
import {CertService} from '@/mtls/cert-service';
import {ZodValidationPipe} from '@anatine/zod-nestjs';
import process from 'node:process';
import {platform, setPriority} from 'os';
import {ConsoleLogger} from '@/app/console-logger';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';
import type {LogLevel} from '@nestjs/common';
import {parseArgs} from '@/app/arguments';

// eslint-disable-next-line max-lines-per-function
asyncLocalStorage.run(new Map<string, string>().set('comb', 'init'), () => {
  const logger = new ConsoleLogger(asyncLocalStorage);
  // eslint-disable-next-line
  const packageJson: string = require('../package.json').version;
  let cliCache = false;
  logger.log(`Booting http-remote-pc-control ${packageJson}`);

  function procesError(err: unknown): void {
    logger.fatal(err as (string | Error), (err as Error)?.stack);
    if (cliCache) {
      process.exit(1);
    } else {
      // Wait for user input before exiting
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      logger.log('Press any key to exit...');
      process.stdin.once('data', () => {
        process.exit(1);
      });
    }
  }

  (async function startApp(): Promise<void> {
    const {port, certDir, logLevel, generate, generateClient, ifMissing, cli} = await parseArgs();
    cliCache = cli;
    logger.setLogLevel(logLevel as LogLevel);

    const os = platform();
    if (os === 'win32') {
      // Windows OS stops receving http traffic after some time. This doesn't solve the issue but I hope makes it better
      setPriority(-2);
    }
    const mtls = await NestFactory.create(
        MtlsModule.forRoot(certDir),
        {logger},
    );
    const certs = mtls.get(CertService);
    if (generate) {
      await certs.generate(ifMissing);
      return;
    }
    if (generateClient) {
      await certs.generateClient(generateClient);
      return;
    }
    await certs.checkCertExist();
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
    app.useGlobalPipes(new ZodValidationPipe());
    logger.log(`Listening port ${port}`);
    await app.listen(port);
  })().catch(procesError);
});

