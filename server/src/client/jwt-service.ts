import {
  Injectable,
  Logger,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import {KeyService} from "@/client/keys-service";

interface JwtPayload {
  username: string;
  roles: string[];
}

@Injectable()
export class JwtService {
  private token: string | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly keyService: KeyService,
  ) {}

  async getToken(): Promise<string> {
    if (!this.token) {
      this.logger.debug('Generating new JWT token');
      const payload: JwtPayload = {
        username: 'admin',
        roles: ['keyboard', 'mouse', 'execution', 'launcher', 'reader'],
      };
      const pk = await this.keyService.getPrivateKey();
      this.token = jwt.sign(payload, pk, {
        algorithm: 'RS256',
        expiresIn: '10d',
      });
    }
    return this.token;
  }
}
