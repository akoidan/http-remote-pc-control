import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {MtlsModule} from '@/mtls/mtls.module';
import {CertService} from '@/mtls/cert-service';
import {asyncLocalStorage, CustomLogger} from '@/app/custom-logger';
import {ZodValidationPipe} from '@anatine/zod-nestjs';
import process from 'node:process';
import {setPriority, platform} from 'os';
import * as path from 'path';
import yargs from 'yargs';

// eslint-disable-next-line @typescript-eslint/naming-convention
async function parseArgs(): Promise<{port: number, certDir: string}> {
  const isNodeJs = process.execPath.endsWith('node') || process.execPath.endsWith('node.exe');
  const defaultCertDir = path.join(isNodeJs ? process.cwd() : path.dirname(process.execPath), 'certs');

  return yargs(process.argv.slice(2))
      .strict()
      .scriptName('http-remote-pc-control')
      .epilog('Reffer https://github.com/akoidan/http-remote-pc-control for more documentation')
      .usage('Allow to controll current PC via https. Keyboard/mouse/window events or launch applications')
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .option('port', {
        type: 'number',
        default: 5000,
        description: 'HTTPS port that this app will listen for remote control',
      })
      .option('cert-dir', {
        type: 'string',
        default: defaultCertDir,
        description: 'Directory that contains key.pem, cert.pem, ca-cert.pem for MTLS',
      })
      .parse();
}

asyncLocalStorage.run(new Map<string, string>().set('comb', 'init'), () => {
  const customLogger = new CustomLogger();
  (async function startApp(): Promise<void> {
    const logger = new CustomLogger();
    // experimental
    const os = platform();
    if (os === 'win32') {
      // otherwise it will stop accepting http
      setPriority(-2);
    }
    const {port, certDir} = await parseArgs();
    const mtls = await NestFactory.create(
        MtlsModule.forRoot(certDir),
        {logger},
    );
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
    app.useGlobalPipes(new ZodValidationPipe());
    logger.log(`Listening port ${port}`);
    await app.listen(port);
  })().catch((err: unknown) => {
    customLogger.error(err as (string | Error), (err as Error)?.stack);
    process.exit(98);
  });
});
