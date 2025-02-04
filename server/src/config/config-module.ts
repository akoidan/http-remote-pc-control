import {
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import * as process from 'node:process';

@Module({
  providers: [
    Logger,
    {
      provide: ConfigService,
      useFactory: (logger: Logger): ConfigService => new ConfigService(
        logger,
        process.env
      ),
      inject: [Logger],
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
  }

  async onModuleInit(): Promise<void> {
    await this.configService.parseConfig();
  }
}
