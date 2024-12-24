import {
  Module,
  OnModuleInit
} from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ConfigService } from '@/config/config-service';

@Module({
  providers: [
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
      useFactory: (configData: string) => new ConfigService(configData),
      inject: ['CONFIG_DATA'],
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
