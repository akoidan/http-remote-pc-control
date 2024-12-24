import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/auth/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { promises as fs } from 'fs';
import * as path from 'path';

@Module({
  imports: [PassportModule],
  providers: [
    {
      provide: 'JWT_PUBLIC_KEY',
      useFactory: async () => {
        return await fs.readFile(
          path.join(__dirname, 'public_key.pem'),
          'utf8',
        );
      },
    },
    JwtAuthGuard,
    {
      provide: JwtStrategy,
      useFactory: (publicKey: string) => new JwtStrategy(publicKey),
      inject: ['JWT_PUBLIC_KEY'],
    },
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
