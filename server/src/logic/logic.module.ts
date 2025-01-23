import {
  Logger,
  Module,
} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {ShortcutProcessingService} from '@/logic/shortcut-processing.service';
import {KeyPressHandler} from '@/logic/commands/key-press-handler';
import {FocusWindowHandler} from '@/logic/commands/focus-window-handler';
import {MouseClickHandler} from '@/logic/commands/mouse-click-handler';
import {ExecuteHandler} from '@/logic/commands/execute-handler';
import {TypeTextHandler} from '@/logic/commands/type-text-handler';
import {KillHandler} from '@/logic/commands/kill-handler';
import {CommandProcessingService} from '@/logic/command-processing.service';
import {ConfigService} from '@/config/config-service';
import {VariableResolutionService} from '@/logic/variable-resolution.service';

@Module({
  imports: [ConfigModule, ClientModule],
  providers: [
    Logger,
    KeyPressHandler,
    FocusWindowHandler,
    MouseClickHandler,
    ExecuteHandler,
    TypeTextHandler,
    KillHandler,
    ShortcutProcessingService,
    VariableResolutionService,
    {
      provide: CommandProcessingService,
      inject: [
        ConfigService,
        VariableResolutionService,
        Logger,
        KeyPressHandler,
        FocusWindowHandler,
        MouseClickHandler,
        ExecuteHandler,
        TypeTextHandler,
        KillHandler,
      ],
      useFactory: (configService, variableService, logger, keyPressHandler, focusWindowHandler, mouseClickHandler, executeHandler, typeTextHandler, killHandler) => {
        keyPressHandler
          .setNext(focusWindowHandler)
          .setNext(mouseClickHandler)
          .setNext(executeHandler)
          .setNext(typeTextHandler)
          .setNext(killHandler);

        return new CommandProcessingService(configService, variableService, logger, keyPressHandler);
      },
    },
  ],
  exports: [ShortcutProcessingService],
})
export class LogicModule {

}
