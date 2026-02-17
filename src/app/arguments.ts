// eslint-disable-next-line @typescript-eslint/naming-convention
import path from 'path';
import process from 'node:process';
import type {LogLevel} from '@nestjs/common';
import yargs from 'yargs';
import type {CliArgs} from '@/app/app-model';

// eslint-disable-next-line max-lines-per-function
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
      // eslint-disable-next-line sonarjs/no-duplicate-string
      conflicts: 'create-client-tls',
      description: 'Generates certificates in the directory if they are missing',
    })
    .option('if-missing', {
      type: 'boolean',
      implies: 'generate',
      description: 'Do not fail on "generate" if certificates exists already. Generate only if they are missing',
    })
    .option('create-client-tls', {
      type: 'string',
      conflicts: 'generate',
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
    .check((argv) => {
      if (argv['create-client-tls'] === '') {
        throw new Error('--create-client-tls requires a non-empty argument');
      }
      return true;
    })
    .parse();
}

export {parseArgs};