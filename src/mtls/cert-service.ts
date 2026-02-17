import {Inject, Injectable, Logger} from '@nestjs/common';
import {access, readFile, constants} from 'fs/promises';
import * as path from 'path';
import {CERT_DIR} from '@/mtls/mtls-model';
import {TlsService} from "@/mtls/tls-service";

@Injectable()
export class CertService {
  private readonly privateKeyPath: string;
  private readonly certificatePath: string;
  private readonly caCertificatePath: string;
  private readonly caRoot: string;
  private readonly caRootKey: string;
  private readonly caRootCert: string;

  constructor(
    private readonly logger: Logger,
    @Inject(CERT_DIR) private readonly certDir: string,
    private readonly tlsService: TlsService,
  ) {
    this.privateKeyPath = path.join(this.certDir, 'key.pem');
    this.certificatePath = path.join(this.certDir, 'cert.pem');
    this.caRoot = path.join(this.certDir, 'ca');
    this.caRootKey = path.join(this.caRoot, 'ca-key.pem');
    this.caRootCert = path.join(this.caRoot, 'ca-cert.pem');
  }

  private async isFileAccessError(fileList: string[]): Promise<string|null> {
    this.logger.debug(`Checking file exists ${JSON.stringify(fileList)}`);
    return Promise.all(fileList.map(async(file) => access(file)))
      .then(() => null)
      .catch((error: unknown) => {
        return `Error while accessing ${JSON.stringify(fileList)} ${(error as Error)?.message ?? error}`;
    });
  }

  public async checkCaExist(): Promise<boolean> {
    return !await this.isFileAccessError([this.caRootKey, this.caRootCert]);
  }

  public async checkWriteAccessAvailable(dirPath: string): Promise<boolean> {
    try {
      // eslint-disable-next-line no-bitwise
      await access(dirPath, constants.F_OK | constants.W_OK)
    } catch (e) {
      return false;
    }
  }

  public async checkClientExists(): Promise<boolean> {
    return !await this.isFileAccessError([this.caRootKey, this.caRootCert]);
  }

  public async checkCertExist(): Promise<void> {
    const fileList = [this.privateKeyPath, this.certificatePath, this.caCertificatePath];
    const error = await this.isFileAccessError(fileList);
    if (error) {
      throw Error(error);
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
