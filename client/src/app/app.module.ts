import {Module} from '@nestjs/common';
import {AppController} from '@/app/app-controller';
import {MtlsModule} from '@/mtls/mtls.module';
import {KeyboardModule} from '@/keyboard/keyboard-module';
import {ExecutionModule} from '@/execution/execution-module';
import {MouseModule} from '@/mouse/mouse-module';
import {CustomLoggerModule} from '@/logger/custom-logger-module';

@Module({
  imports: [
    MtlsModule,
    KeyboardModule,
    ExecutionModule,
    MouseModule,
    CustomLoggerModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {
}
