import {
  Inject,
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
import {asyncLocalStorage} from '@/app/custom-logger';
import {NativeModule} from '@/native/native-module';
import clc from 'cli-color';

@Module({
  imports: [ConfigModule, ClientModule, LogicModule, NativeModule],
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
        Object.keys(this.configService.getIps())
          .map(async(desination) => this.clientService.ping(desination))
      );
      this.configService.getCombinations().forEach((comb) => {
        this.hotKeyService.registerShortcut(comb.shortCut, () => {
          asyncLocalStorage.run(new Map(), () => {
            asyncLocalStorage.getStore()!.set('comb', Math.random().toString(36).substring(2, 6));
            this.logger.log(`${clc.bold.green(comb.shortCut)} pressed`);
            this.logicService.processUnknownShortCut(comb).catch((err: unknown) => this.logger.error(err));
          });
        });
      });
      const shorcuts = this.configService.getCombinations().map(a => a.shortCut);
      this.logger.log(`App has sucessfully started with following shorcuts: ${clc.bold.green(shorcuts.join(' '))}`);
    } catch (err) {
      this.logger.error(`Unable to init main module: ${(err as Error).message}`, (err as Error).stack);
      this.hotKeyService.unregister();
    }
  }
}
