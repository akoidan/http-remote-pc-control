import {Injectable, Logger,} from '@nestjs/common';

import {promises as fs} from 'fs';
import * as path from 'path';

@Injectable()
export class KeyService {
  constructor(
      private readonly logger: Logger,
  ) {
  }

  private get externalTokenPath(): string {
    return path.join(path.dirname(process.execPath), 'l2_public_key.pem');
  }

  private getPackedToken(): Promise<string> {
    this.logger.warn("Using internal packed publicKey");
    return fs.readFile(path.join(__dirname, 'public_key.pem'), 'utf8');
  }


  private getExternalToken(): Promise<string> {
    this.logger.log(`Loading external public key from ${this.externalTokenPath}`);
    return fs.readFile(this.externalTokenPath, 'utf8');
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
