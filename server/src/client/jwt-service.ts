import {
  Injectable,
  Logger,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  username: string;
  roles: string[];
}

@Injectable()
export class JwtService {
  private token: string | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly privateKey: string,
  ) {}

  getToken(): string {
    if (!this.token) {
      this.logger.debug('Generating new JWT token');
      const payload: JwtPayload = {
        username: 'admin',
        roles: ['keyboard', 'mouse', 'execution', "launcher", 'reader'],
      };
      this.token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        expiresIn: '10d',
      });
    }
    return this.token;
  }
}
