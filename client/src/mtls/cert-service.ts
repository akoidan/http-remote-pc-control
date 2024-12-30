import {Injectable} from '@nestjs/common';
import {
  readFile,
  access,
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

  private get privateKeyPath(): string {
    return path.join(process.cwd(), 'certs', 'key.pem');
  }

  private get certificatePath(): string {
    return path.join(process.cwd(), 'certs', 'cert.pem');
  }

  private get caCertificatePath(): string {
    return path.join(process.cwd(), 'certs', 'ca-cert.pem');
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
    return readFile(this.privateKeyPath, 'utf8');
  }

  public async getCert(): Promise<string> {
    return readFile(this.certificatePath, 'utf8');
  }

  public async getCaCert(): Promise<string> {
    return readFile(this.caCertificatePath, 'utf8');
  }
}
