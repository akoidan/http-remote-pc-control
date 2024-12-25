import {
  Module,
  OnModuleInit,
  Logger
} from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ConfigService } from '@/config/config-service';

@Module({
  providers: [
    Logger,
    {
      provide: 'CONFIG_DATA',
      useFactory: async () => {
        return await fs.readFile(
          path.join(__dirname, 'config.jsonc'),
          'utf8',
        );
      },
    },
    {
      provide: ConfigService,
      useFactory: (configData: string, logger: Logger) => new ConfigService(configData, logger),
      inject: ['CONFIG_DATA', Logger],
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule implements OnModuleInit{
  constructor(private configService: ConfigService) {
  }

  async onModuleInit() {
    await this.configService.parseConfig();
  }
}
