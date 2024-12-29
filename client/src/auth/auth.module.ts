import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {JwtStrategy} from '@/auth/jwt.strategy';
import {KeyService} from '@/auth/keys-service';

@Module({
  imports: [
    PassportModule,
  ],
  providers: [
    KeyService,
    {
      provide: JwtStrategy,
      useFactory: async(keyService: KeyService): Promise<JwtStrategy> => new JwtStrategy(await keyService.getPrivateKey()),
      inject: [KeyService],
    },
  ],
  exports: [],
})
export class AuthModule {
}
