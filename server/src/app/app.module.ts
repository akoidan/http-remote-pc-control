import {
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import {HotkeyService} from '@/app/hotkey.service';
import {LogicService} from '@/app/logic-service';
import {ConfigModule} from '@/config/config-module';
import {ConfigService} from '@/config/config-service';
import {ClientModule} from '@/client/client-module';

@Module({
  imports: [ConfigModule, ClientModule],
  providers: [Logger, HotkeyService, LogicService],
  exports: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly hotKeyService: HotkeyService,
    private readonly logicService: LogicService,
    private readonly configService: ConfigService,
  ) {
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.debug('Initializing app...');
      await this.logicService.pingClients();
      await this.hotKeyService.bootstrap();
      this.configService.getCombinations().forEach((comb) => {
        this.hotKeyService.registerShortcut(comb.shortCut, () => {
          this.logicService.processEvent(comb).catch((err: unknown) => this.logger.error(err));
        });
      });
      this.logger.log('App has sucessfully started');
    } catch (err) {
      this.logger.error(`Unable to init main module: ${(err as Error).message}`, (err as Error).stack);
      this.hotKeyService.shutdown();
    }
  }
}
