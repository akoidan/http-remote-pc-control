import {Module} from '@nestjs/common';
import {AppController} from '@/event/app-controller';
import {LoggerModule} from 'nestjs-pino';
import {AuthModule} from '@/auth/auth.module';
import {KeyboardModule} from "@/keyboard/keyboard-module";
import {ExecutionModule} from "@/execution/execution-module";
import {MouseModule} from "@/mouse/mouse-module";

@Module({
  imports: [
    AuthModule,
    KeyboardModule,
    ExecutionModule,
    MouseModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: "debug", // Global log level
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            levelFirst: false,
            messageFormat: '\u001b[36m{reqId}\u001b[39m: \u001b[38;5;237m{msg}\u001b[39m',
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname,context,req,res,responseTime,reqId',
            destination: 1, // stdout
          },
        },
        genReqId: (req) => {
          return req.id = Math.random().toString(36).substring(2, 6); // Random 4-char ID
        },
        customProps: (req) => ({
          reqId: req.id ?? '   '
        }),

        // Custom format for success messages
        customSuccessMessage: (req: any, res: any) => {
          if (res.statusCode >= 400) {
            return `\u001b[33m${req.method} \u001b[35m${req.url} \u001b[31m${res.statusCode} \u001b[38;5;237m${req.ip} ${JSON.stringify(req.body ?? '')}`;
          } else {
            return `\u001b[33m${req.method} \u001b[35m${req.url} \u001b[32m${res.statusCode} \u001b[38;5;237m${req.ip} ${JSON.stringify(req.body ?? '')}`;
          }
        },

        customErrorMessage: (req: any, res: any) => {
          return `\u001b[33m${req.method} \u001b[35m${req.url} \u001b[31m${res.statusCode} \u001b[38;5;237m${req.ip} ${JSON.stringify(req.body ?? '')}`;
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {
}
