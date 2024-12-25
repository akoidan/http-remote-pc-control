import {
  Logger,
  Module,
  OnModuleInit
} from '@nestjs/common';
import { ElectronService } from '@/app/electron-service';
import { LogicService } from '@/app/logic-service';
import { ConfigModule } from '@/config/config-module';
import { ConfigService } from '@/config/config-service';
import { ClientModule } from '@/client/client-module';

@Module({
  imports: [ConfigModule, ClientModule],
  providers: [Logger, ElectronService, LogicService],
  exports: [],
})
export class AppModule implements OnModuleInit {

  constructor(
    private readonly logger: Logger,
    private readonly electronService: ElectronService,
    private readonly logicService: LogicService,
    private readonly configService: ConfigService,
  ) {
  }

  async onModuleInit() {
    try {
      this.logger.debug('Initializing app...');
      await this.logicService.pingClients();
      await this.electronService.bootstrap();
      this.configService.getCombinations().forEach((comb) => {
        this.electronService.registerShortcut(comb.shortCut, () => this.logicService.processEvent(comb));
      })
      this.logger.log('App has sucessfully started');
    } catch (e) {
      this.logger.error(`Unable to init main module: ${e.message}`, e.stack);
      await this.electronService.shutdown();
    }
  }
}
