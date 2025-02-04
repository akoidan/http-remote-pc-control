import {Test} from '@nestjs/testing';
import {ShortcutProcessingService} from '@/logic/shortcut-processing.service';
import {ClientService} from '@/client/client-service';
import {Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {LogicModule} from '@/logic/logic.module';
import {ConfigsPathService} from '@/config/configs-path.service';

describe('logic-service', () => {
  it('should demo curl request', async() => {
    const testModule = await Test.createTestingModule({
      imports: [LogicModule],
      providers: [
        {
          provide: ClientService,
          useClass: class Empty {
            async keyPress(d1: string, d2: object): Promise<void> {
              console.log(`called ${d1}, ${JSON.stringify(d2)}`);
            }
            async focusExe(d1: string, d2: object): Promise<void> {
              console.log(`called ${d1}, ${JSON.stringify(d2)}`);
            }
          },
        },
        {
          provide: ConfigService,
          useFactory: (logger: Logger) => new ConfigService(logger, process.env, new ConfigsPathService()),
          inject: [Logger],
        },
        Logger,
        ShortcutProcessingService,
      ],
    }).compile();

    const photoService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    await tyrs.parseConfig();
    await photoService.processUnknownShortCut({
      commands: [
        {
          destination: 'tyrs',
          keySend: 'f6',
        },
        {
          destination: 'asus',
          keySend: 'f6',
        },
        {
          focusPid: '{{se}}',
          destination: 'desktop',
        },
        {
          destination: 'desktop',
          keySend: 'f6',
        },
        {
          focusPid: '{{wc}}',
          destination: 'desktop',
        },
        {
          destination: 'desktop',
          keySend: 'f6',
        },
        {
          focusPid: '{{ee}}',
          destination: 'desktop',
        },
        {
          destination: 'desktop',
          keySend: 'f6',
        },
      ],
      name: 'Raging Force Tyr(-Pdef)',
      shortCut: 'Alt+c',
    });
  });
});
