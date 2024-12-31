import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  access,
  readFile,
} from 'fs/promises';
import * as path from 'path';
import {Agent} from 'https';

@Injectable()
export class CertService {
  constructor(
    private readonly logger: Logger,
  ) {
  }

  private get certDir(): string {
    return path.join(process.execPath.endsWith('electron') ? process.cwd() : path.dirname(process.execPath), 'certs');
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

  public async getHttpAgent(): Promise<Agent> {
    await this.checkFilesExist();
    const [cert, key, ca] = await Promise.all([this.getCert(), this.getPrivateKey(), this.getCaCert()]);
    return new Agent({
      cert,
      key,
      ca,
      rejectUnauthorized: true,
      checkServerIdentity: () => undefined,
    });
  }


  public async getPrivateKey(): Promise<string> {
    this.logger.log(`Loading private key from ${this.privateKeyPath}`);
    return readFile(this.privateKeyPath, 'utf8');
  }

  public async getCert(): Promise<string> {
    this.logger.log(`Loading private key from ${this.certificatePath}`);
    return readFile(this.certificatePath, 'utf8');
  }

  public async getCaCert(): Promise<string> {
    this.logger.log(`Loading private key from ${this.caCertificatePath}`);
    return readFile(this.caCertificatePath, 'utf8');
  }
}
