import {
  Module,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import {promises as fs} from 'fs';
import * as path from 'path';
import {ConfigService} from '@/config/config-service';
import * as process from 'node:process';

@Module({
  providers: [
    Logger,
    {
      provide: 'CONFIG_DATA',
      useFactory: async(): Promise<string> => {
        return fs.readFile(
          path.join(__dirname, 'config.jsonc'),
          'utf8',
        );
      },
    },
    {
      provide: ConfigService,
      useFactory: (configData: string, logger: Logger): ConfigService => new ConfigService(configData, logger, process.env),
      inject: ['CONFIG_DATA', Logger],
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.configService.parseConfig();
  }
}
