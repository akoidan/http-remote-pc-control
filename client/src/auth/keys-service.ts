import {Injectable} from '@nestjs/common';
import {promises as fs} from 'fs';
import * as path from 'path';
import {InjectPinoLogger, PinoLogger} from 'nestjs-pino';

@Injectable()
export class KeyService {
  constructor(
      @InjectPinoLogger(KeyService.name)
      private readonly logger: PinoLogger,
  ) {
  }

  private get externalTokenPath(): string {
    return path.join(path.dirname(process.execPath), 'l2_public_key.pem');
  }

  private async getPackedToken(): Promise<string> {
    const token =  await fs.readFile(path.join(__dirname, 'public_key.pem'), 'utf8');
    this.logger.warn('Using internal packed publicKey');
    return token;
  }

 private async getExternalToken(): Promise<string> {
    const token =  await fs.readFile(this.externalTokenPath, 'utf8');
    this.logger.warn(`Loading external public key from ${this.externalTokenPath}`);
    return token;
  }

  async getPrivateKey(): Promise<string> {
    try {
      return await this.getExternalToken();
    } catch (e) {
      this.logger.warn(`Unable to load ${this.externalTokenPath} because ${e.message}`);
      return this.getPackedToken();
    }
  }
}
