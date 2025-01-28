import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import {AppController} from '@/app/app-controller';
import {KeyboardModule} from '@/keyboard/keyboard-module';
import {ExecutionModule} from '@/execution/execution-module';
import {MouseModule} from '@/mouse/mouse-module';
import {RequestIdMiddleware} from '@/app/request-id-middleware';

@Module({
  imports: [KeyboardModule, ExecutionModule, MouseModule],
  controllers: [AppController],
  providers: [Logger, RequestIdMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
