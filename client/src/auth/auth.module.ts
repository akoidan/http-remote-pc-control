import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {JwtStrategy} from '@/auth/jwt.strategy';
import {KeyService} from "@/auth/keys-service";
import {LoggerModuleExport} from "@/app/logger-module";

@Module({
  imports: [
    PassportModule,
    LoggerModuleExport
  ],
  providers: [
    KeyService,
    JwtStrategy,
  ],
  exports: [],
})
export class AuthModule {
}
