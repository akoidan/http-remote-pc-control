import { Module } from '@nestjs/common';
import { EventController } from '@/event/event-controller';
import { KeyboardService } from '@/event/keyboard-service';
import { LoggerModule } from 'nestjs-pino';
import { MouseService } from '@/event/mouse-service';
import { LauncherService } from '@/event/launcher-service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
  ],
  controllers: [EventController],
  providers: [
    KeyboardService,
    MouseService,
    LauncherService,
  ],
})
export class EventModule {}
