import {Injectable} from '@nestjs/common';
import {
  access,
  readFile,
} from 'fs/promises';
import * as path from 'path';
import {
  InjectPinoLogger,
  PinoLogger,
} from 'nestjs-pino';

@Injectable()
export class CertService {
  constructor(
    @InjectPinoLogger(CertService.name)
    private readonly logger: PinoLogger,
  ) {
  }

  private get certDir(): string {
    return path.join(process.execPath.endsWith('node') ? process.cwd() : path.dirname(process.execPath), 'certs');
  }

  private get privateKeyPath(): string {
    return path.join(this.certDir, 'key.pem');
  }

  private get certificatePath(): string {
    return path.join(this.certDir, 'cert.pem');
  }

  private get caCertificatePath(): string {
    return path.join(this.certDir, 'ca-cert.pem');
  }

  public async checkFilesExist(): Promise<void> {
    const fileList = [
      this.privateKeyPath,
      this.certificatePath,
      this.caCertificatePath,
    ];
    try {
      this.logger.debug('Checking if certificates files exists');
      await Promise.all(fileList.map(async(file) => access(file)));
    } catch (error) {
      this.logger.error(`Cannot find/load certificate files ${JSON.stringify(fileList)}`);
      throw error;
    }
  }


  public async getPrivateKey(): Promise<string> {
    this.logger.info(`Loading private key from ${this.privateKeyPath}`);
    return readFile(this.privateKeyPath, 'utf8');
  }

  public async getCert(): Promise<string> {
    this.logger.info(`Loading certificate key from ${this.certificatePath}`);
    return readFile(this.certificatePath, 'utf8');
  }

  public async getCaCert(): Promise<string> {
    this.logger.info(`Loading CA certificate key from ${this.caCertificatePath}`);
    return readFile(this.caCertificatePath, 'utf8');
  }
}
