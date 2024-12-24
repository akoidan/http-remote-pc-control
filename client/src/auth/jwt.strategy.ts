import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(publicKey: string) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey, // Dynamically set public key
      algorithms: ['RS256'], // Use RS256 algorithm
    });
  }

  async validate(payload: any) {
    return { username: payload.username, roles: payload.roles };
  }
}
