import {
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import {HotkeyService} from '@/app/hotkey.service';
import {ConfigModule} from '@/config/config-module';
import {ConfigService} from '@/config/config-service';
import {ClientModule} from '@/client/client-module';
import {ClientService} from '@/client/client-service';
import {ShortcutProcessingService} from '@/logic/shortcut-processing.service';
import {LogicModule} from '@/logic/logic.module';

@Module({
  imports: [ConfigModule, ClientModule, LogicModule],
  providers: [Logger, HotkeyService],
  exports: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly hotKeyService: HotkeyService,
    private readonly logicService: ShortcutProcessingService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
  ) {
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.debug('Initializing app...');
      await Promise.all(
        Object.entries(this.configService.getIps())
          .map(async([_, ip]) => this.clientService.ping(ip))
      );
      await this.hotKeyService.init();
      this.configService.getCombinations().forEach((comb) => {
        this.hotKeyService.registerShortcut(comb.shortCut, () => {
          this.logicService.processUnknownShortCut(comb).catch((err: unknown) => this.logger.error(err));
        });
      });
      this.logger.log('App has sucessfully started');
    } catch (err) {
      this.logger.error(`Unable to init main module: ${(err as Error).message}`, (err as Error).stack);
      this.hotKeyService.shutdown();
    }
  }
}
