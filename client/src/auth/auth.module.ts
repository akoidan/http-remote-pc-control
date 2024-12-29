import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {JwtStrategy} from '@/auth/jwt.strategy';
import {promises as fs} from 'fs';
import * as path from 'path';

@Module({
  imports: [PassportModule],
  providers: [
    {
      provide: 'JWT_PUBLIC_KEY',
      useFactory: async(): Promise<string> => {
        return fs.readFile(
          path.join(__dirname, 'public_key.pem'),
          'utf8',
        );
      },
    },
    {
      provide: JwtStrategy,
      useFactory: (publicKey: string): JwtStrategy => new JwtStrategy(publicKey),
      inject: ['JWT_PUBLIC_KEY'],
    },
  ],
  exports: [],
})
export class AuthModule {}
