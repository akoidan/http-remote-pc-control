import {MiddlewareConsumer, Module, NestModule, ModuleMetadata} from '@nestjs/common';
import {AppController} from '@/app/app-controller';
import {KeyboardModule} from '@/keyboard/keyboard-module';
import {MouseModule} from '@/mouse/mouse-module';
import {RequestIdMiddleware} from '@/app/request-id-middleware';
import {WindowModule} from '@/window/window-module';
import {NativeModule} from '@/native/native-module';
import {MonitorModule} from '@/monitor/monitor-module';
import {ProcessModule} from '@/process/process-module';
import {GlobalModule} from '@/global/global-module';
import {TRPCModule} from 'nestjs-trpc';
import {CustomLogger} from '@/app/custom-logger';
import {customLogger} from '@/app/app-logger-instance';

@Module({
  imports: [
    GlobalModule,
    KeyboardModule,
    MouseModule,
    WindowModule,
    MonitorModule,
    ProcessModule,
    NativeModule,
    TRPCModule.forRoot({
      logger: customLogger,
    }),
  ],
  controllers: [AppController],
  providers: [RequestIdMiddleware, CustomLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
