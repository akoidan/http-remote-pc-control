import {Module} from '@nestjs/common';
import {ClientModule} from '@/client/client-module';
import {KeyPressHandler} from '@/handlers/implementation/key-press-handler';
import {FocusWindowHandler} from '@/handlers/implementation/focus-window-handler';
import {MouseClickHandler} from '@/handlers/implementation/mouse-click-handler';
import {ExecuteHandler} from '@/handlers/implementation/execute-handler';
import {TypeTextHandler} from '@/handlers/implementation/type-text-handler';
import {KillNameHandler} from '@/handlers/implementation/kill-name-handler';
import {CommandHandler} from '@/handlers/command-handler.service';
import {KillPidHandler} from '@/handlers/implementation/kill-pid-handler';
import {ConfigModule} from '@/config/config-module';

@Module({
  imports: [ClientModule, ConfigModule],
  providers: [
    KeyPressHandler,
    FocusWindowHandler,
    MouseClickHandler,
    ExecuteHandler,
    TypeTextHandler,
    KillNameHandler,
    KillPidHandler,
    {
      provide: CommandHandler,
      inject: [
        KeyPressHandler,
        FocusWindowHandler,
        MouseClickHandler,
        ExecuteHandler,
        TypeTextHandler,
        KillNameHandler,
        KillPidHandler,
      ],
      useFactory: (
        keyPressHandler: CommandHandler,
        focusWindowHandler: CommandHandler,
        mouseClickHandler: CommandHandler,
        executeHandler: CommandHandler,
        typeTextHandler: CommandHandler,
        killByNameHandler: CommandHandler,
        killByPidHandler: CommandHandler,
      ): CommandHandler => {
        keyPressHandler
          .setNext(focusWindowHandler)
          .setNext(mouseClickHandler)
          .setNext(executeHandler)
          .setNext(typeTextHandler)
          .setNext(killByNameHandler)
          .setNext(killByPidHandler);

        return keyPressHandler;
      },
    },
  ],
  exports: [CommandHandler],
})
export class HandlerModule {

}
