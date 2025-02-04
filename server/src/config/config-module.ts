import {
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import * as process from 'node:process';
import {ConfigsPathService} from '@/config/configs-path.service';

@Module({
  providers: [
    Logger,
    ConfigsPathService,
    {
      provide: ConfigService,
      useFactory: (logger: Logger, configPath: ConfigsPathService): ConfigService => new ConfigService(
        logger,
        process.env,
        configPath,
      ),
      inject: [Logger, ConfigsPathService],
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
