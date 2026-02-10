import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {AppController} from '@/app/app-controller';
import {KeyboardModule} from '@/keyboard/keyboard-module';
import {MouseModule} from '@/mouse/mouse-module';
import {RequestIdMiddleware} from '@/app/request-id-middleware';
import {WindowModule} from '@/window/window-module';
import {NativeModule} from '@/native/native-module';
import {MonitorModule} from '@/monitor/monitor-module';
import {ProcessModule} from '@/process/process-module';
import {GlobalModule} from '@/global/global-module';
import {GraphQLModule} from '@/graphql/graphql.module';

@Module({
  imports: [GlobalModule, KeyboardModule, MouseModule, WindowModule, MonitorModule, ProcessModule, NativeModule, GraphQLModule],
  controllers: [AppController],
  providers: [RequestIdMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
