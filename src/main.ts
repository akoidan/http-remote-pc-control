import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {MtlsModule} from '@/mtls/mtls.module';
import {CertService} from '@/mtls/cert-service';
import {ZodValidationPipe} from '@anatine/zod-nestjs';
import process from 'node:process';
import {platform, setPriority} from 'os';
import * as path from 'path';
import yargs from 'yargs';
import {ConsoleLogger} from '@/app/console-logger';
import {asyncLocalStorage} from '@/asyncstore/async-storage-value';
import type {LogLevel} from '@nestjs/common';

interface CliArgs {
  port: number,
  certDir: string,
  logLevel: string,
  generate: boolean,
  generateClient?: string,
  ifMissing: boolean
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function parseArgs(): Promise<CliArgs> {
  const defaultCertDir = path.join(process.cwd(), 'certs');
  const logLevel: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose', 'fatal'] as LogLevel[];
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
      .option('generate', {
        type: 'boolean',
        default: false,
        description: 'Generates certificates in the directory if they are missing',
      })
      .option('if-missing', {
        type: 'boolean',
        default: false,
        description: 'Do not fail on "generate" if certificates exists already. Generate only if they are missing',
      })
      .option('generate-client', {
        type: 'string',
        description: 'Generates a directory with specified name with client certificates',
      })
      .option('log-level', {
        choices: logLevel,
        default: 'log',
        description: 'Log level. Set to debug to print more info',
      })
      .option('cert-dir', {
        type: 'string',
        default: defaultCertDir,
        description: 'Directory that contains key.pem, cert.pem, ca-cert.pem for MTLS',
      })
      .implies('if-missing', 'generate')
      .conflicts('generate', 'generate-client')
      .parse();
}

asyncLocalStorage.run(new Map<string, string>().set('comb', 'init'), () => {
  const logger = new ConsoleLogger(asyncLocalStorage);
  // eslint-disable-next-line
  const packageJson: string = require('../package.json').version;
  logger.log(`Booting http-remote-pc-control ${packageJson}`);
  (async function startApp(): Promise<void> {
    const {port, certDir, logLevel, generate, generateClient, ifMissing} = await parseArgs();
    logger.setLogLevel(logLevel as LogLevel);

    const os = platform();
    if (os === 'win32') {
      // otherwise it will stop accepting http
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
  })().catch((err: unknown) => {
    logger.fatal(err as (string | Error), (err as Error)?.stack);

    // Wait for user input before exiting
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    logger.log('Press any key to exit...');

    process.stdin.once('data', () => {
      process.exit(98);
    });
  });
});

