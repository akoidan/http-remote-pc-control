import {
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import * as process from 'node:process';
import {ConfigsPathService} from '@/config/configs-path.service';
import {ConfigReaderService} from '@/config/config-reader-service';

@Module({
  providers: [
    Logger,
    ConfigsPathService,
    ConfigReaderService,
    {
      provide: ConfigService,
      useFactory: (logger: Logger, reader: ConfigReaderService): ConfigService => new ConfigService(
        logger,
        process.env,
        reader,
      ),
      inject: [Logger, ConfigReaderService],
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
