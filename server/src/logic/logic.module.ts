import {
  Logger,
  Module,
} from '@nestjs/common';
import {ConfigModule} from '@/config/config-module';
import {ClientModule} from '@/client/client-module';
import {ShortcutProcessingService} from '@/logic/shortcut-processing.service';
import {VariableResolutionService} from '@/logic/variable-resolution.service';
import {HandlerModule} from '@/handlers/handler-module';
import {CommandProcessingService} from '@/logic/command-processing.service';
import { CircularIndex } from '@/logic/circular-index';

@Module({
  imports: [ConfigModule, ClientModule, HandlerModule],
  providers: [
    Logger,
    ShortcutProcessingService,
    VariableResolutionService,
    CommandProcessingService,
    CircularIndex,
  ],
  exports: [ShortcutProcessingService],
})
export class LogicModule {

}
