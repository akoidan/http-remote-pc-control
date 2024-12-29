import {
  Logger,
  Module, OnModuleInit,
} from '@nestjs/common';
import {FetchClient} from '@/client/http-client';
import {ClientService} from '@/client/client-service';
import {JwtService} from '@/client/jwt-service';
import {KeyService} from "@/client/keys-service";
import {HotkeyService} from "@/app/hotkey.service";
import {LogicService} from "@/app/logic-service";
import {ConfigService} from "@/config/config-service";


@Module({
  providers: [
    Logger,
    KeyService,
    JwtService,
    {
      provide: FetchClient,
      useFactory: (logger: Logger, jwt: JwtService): FetchClient => new FetchClient(logger, jwt, 'http', 5000),
      inject: [Logger, JwtService],
    },
    ClientService,
  ],
  exports: [ClientService],
})
export class ClientModule {
}
