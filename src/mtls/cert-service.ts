/* eslint-disable max-lines */
import {Inject, Injectable, Logger} from '@nestjs/common';
import {access, readFile, constants, writeFile, mkdir} from 'fs/promises';
import * as path from 'path';
import {CERT_DIR} from '@/mtls/mtls-model';
import {TlsService} from '@/mtls/tls-service';

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

  public async generate(onlyIfMissing: boolean): Promise<void> {
    const caExists = await this.checkCaExist();
    const clientExists = await this.checkClientExists();

    if (onlyIfMissing && caExists && clientExists) {
      this.logger.log('All certificates already exist, skipping generation');
      return;
    }
    // If some files exist, this is an error state
    if (onlyIfMissing && (caExists || clientExists)) {
      throw new Error('Some certificates exist but others are missing. Remove output directories');
    }

    if (caExists || clientExists) {
      throw new Error('Certificate files already exist. Use --if-missing to generate only if missing');
    }

    // Generate CA
    this.logger.log('Generating CA certificates...');
    const caData = this.tlsService.ca();
    await mkdir(this.caRoot, {recursive: true});
    await Promise.all([
      writeFile(this.caRootKey, caData.key, 'utf8'),
      writeFile(this.caRootCert, caData.cert, 'utf8'),
    ]);
    this.logger.log(`Created CA: ${this.caRootKey}, ${this.caRootCert}`);

    // Generate server client (certs go to certDir root)
    this.logger.log('Generating server certificates...');
    const serverData = this.tlsService.client(caData.key, caData.cert);
    await mkdir(this.certDir, {recursive: true});
    await Promise.all([
      writeFile(this.privateKeyPath, serverData.key, 'utf8'),
      writeFile(this.certificatePath, serverData.cert, 'utf8'),
      writeFile(this.caCertificatePath, serverData.caCert, 'utf8'),
    ]);
    this.logger.log(`Created server: ${this.privateKeyPath}, ${this.certificatePath}`);

    // Generate regular client
    this.logger.log('Generating client certificates...');
    const clientDir = path.join(this.certDir, 'client');
    await mkdir(clientDir, {recursive: true});
    const clientData = this.tlsService.client(caData.key, caData.cert);
    await Promise.all([
      writeFile(path.join(clientDir, 'key.pem'), clientData.key, 'utf8'),
      writeFile(path.join(clientDir, 'cert.pem'), clientData.cert, 'utf8'),
      writeFile(path.join(clientDir, 'ca-cert.pem'), clientData.caCert, 'utf8'),
    ]);
    this.logger.log(`Created client: ${path.join(clientDir, 'key.pem')}, ${path.join(clientDir, 'cert.pem')}`);
  }

  public async generateClient(clientName: string): Promise<void> {
    if (!clientName) {
      throw new Error('Client name is required');
    }

    // Check if CA exists
    const caExists = await this.checkCaExist();
    if (!caExists) {
      throw new Error('CA certificates not found. Generate CA first');
    }

    // Check if client directory already exists and is not empty
    const clientDir = path.join(this.certDir, clientName);
    const clientDirExists = await this.checkWriteAccessAvailable(clientDir);
    if (clientDirExists) {
      throw new Error(`Client directory '${clientName}' already exists`);
    }

    this.logger.log(`Generating client certificate in: ${clientDir}`);

    // Load CA data
    const caKey = await readFile(this.caRootKey, 'utf8');
    const caCert = await readFile(this.caRootCert, 'utf8');

    // Generate client certificates
    const clientData = this.tlsService.client(caKey, caCert);

    // Create client directory and write files
    await mkdir(clientDir, {recursive: true});
    await Promise.all([
      writeFile(path.join(clientDir, 'key.pem'), clientData.key, 'utf8'),
      writeFile(path.join(clientDir, 'cert.pem'), clientData.cert, 'utf8'),
      writeFile(path.join(clientDir, 'ca-cert.pem'), clientData.caCert, 'utf8'),
    ]);

    this.logger.log(`Created ${path.join(clientDir, 'key.pem')} ${path.join(clientDir, 'cert.pem')}`);
  }


  private async isFileAccessError(fileList: string[]): Promise<string | null> {
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
      await access(dirPath, constants.F_OK | constants.W_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  public async checkClientExists(): Promise<boolean> {
    const serverFiles = [this.privateKeyPath, this.certificatePath, this.caCertificatePath];
    const clientDir = path.join(this.certDir, 'client');
    const clientFiles = [
      path.join(clientDir, 'key.pem'),
      path.join(clientDir, 'cert.pem'),
      path.join(clientDir, 'ca-cert.pem'),
    ];

    const serverExists = !await this.isFileAccessError(serverFiles);
    const clientExists = !await this.isFileAccessError(clientFiles);

    return serverExists && clientExists;
  }

  public async checkCertExist(): Promise<void> {
    const fileList = [this.privateKeyPath, this.certificatePath, this.caCertificatePath];
    const error =await this.isFileAccessError(fileList);
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
