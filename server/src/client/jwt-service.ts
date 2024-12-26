import {
  Injectable,
  Logger,
} from '@nestjs/common';

import jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private token: string | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly privateKey: string,
  ) {

  }

  getToken() {
    if (!this.token) {
      this.logger.debug('Generating new JWT token');
      this.token = jwt.sign({username: 'admin', roles: ['keyboard', 'mouse', 'launcher', 'reader']}, this.privateKey, {
        algorithm: 'RS256',
        expiresIn: '10d',
      });
    }
    return this.token;
  }
}
