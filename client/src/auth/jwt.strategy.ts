import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {KeyService} from "@/auth/keys-service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(keyService: KeyService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: await keyService.getPrivateKey(), // Dynamically set public key
      algorithms: ['RS256'], // Use RS256 algorithm
    });
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  validate(payload: any): unknown {
    if (!payload.username || !payload.roles) {
      throw new UnauthorizedException();
    }
    return {username: payload.username, roles: payload.roles};
  }
}
