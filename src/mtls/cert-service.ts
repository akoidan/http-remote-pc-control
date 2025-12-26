import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  access,
  readFile,
} from 'fs/promises';
import * as path from 'path';
import {CERT_DIR} from '@/mtls/mtls-model';

@Injectable()
export class CertService {
  private readonly privateKeyPath: string;
  private readonly certificatePath: string;
  private readonly caCertificatePath: string;

  constructor(
    private readonly logger: Logger,
    @Inject(CERT_DIR) private readonly certDir: string,
  ) {
    this.privateKeyPath = path.join(this.certDir, 'key.pem');
    this.certificatePath = path.join(this.certDir, 'cert.pem');
    this.caCertificatePath = path.join(this.certDir, 'ca-cert.pem');
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
    this.logger.debug(`Loading private key from ${this.privateKeyPath}`);
    return readFile(this.privateKeyPath, 'utf8');
  }

  public async getCert(): Promise<string> {
    this.logger.debug(`Loading certificate key from ${this.certificatePath}`);
    return readFile(this.certificatePath, 'utf8');
  }

  public async getCaCert(): Promise<string> {
    this.logger.debug(`Loading CA certificate key from ${this.caCertificatePath}`);
    return readFile(this.caCertificatePath, 'utf8');
  }
}
