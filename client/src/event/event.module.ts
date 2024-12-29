import { Module } from '@nestjs/common';
import { EventController } from '@/event/event-controller';
import { KeyboardService } from '@/event/keyboard-service';
import { LoggerModule } from 'nestjs-pino';
import { MouseService } from '@/event/mouse-service';
import { LauncherService } from '@/event/launcher-service';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: "debug",
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            levelFirst: false,
            messageFormat: '\u001b[36m{reqId}\u001b[39m: \u001b[38;5;237m{msg}\u001b[39m',
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname,context,req,res,responseTime,reqId',
            destination: 1, // The file or file descriptor (1 is stdout) to write to
          },
        },
        genReqId: (req) => {
          return req.id = Math.random().toString(36).substring(2, 6);
        },
        customProps: (req) => ({
          reqId: req.id ?? '   '
        }),
        customSuccessMessage: (req: any) => {
          // if (!req?.body) return `${req.method} ${req.url} from ${req.ip}`;
          // return `\u001b[35m${req.method}\u001b[33m ${req.url} \u001b[38;5;237m${JSON.stringify(req.body)} from ${req.ip}`;
          return `\u001b[33m${req.method} \u001b[35m${req.url} \u001b[38;5;237m${JSON.stringify( req.body ?? '' )} from ${req.ip}`;
        }
      },
    }),
  ],
  controllers: [EventController],
  providers: [KeyboardService, MouseService, LauncherService],
})
export class EventModule {}
