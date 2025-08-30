import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import {writeFile} from 'fs/promises';
import {KeyboardModule} from '@/keyboard/keyboard-module';
import {ExecuteModule} from '@/execute/execute-module';
import {MouseModule} from '@/mouse/mouse-module';
import {WindowModule} from '@/window/window-module';
import {MonitorModule} from '@/monitor/monitor-module';
import {ProcessModule} from '@/process/process-module';
import {Native} from '@/native/native-model';
import {AppController} from '@/app/app-controller';
import {NestFactory} from '@nestjs/core';
import {
  Global,
  Module,
} from '@nestjs/common';

async function bootstrap(): Promise<void> {
  @Global()
  @Module({
    providers: [{
      provide: Native, // exclude native dependency, since it's not required
      useValue: {},
    }],
    exports: [Native],
  })
  class NativeMock {
  }

  @Module({
    imports: [
      NativeMock,
      KeyboardModule,
      ExecuteModule,
      MouseModule,
      WindowModule,
      MonitorModule,
      ProcessModule,
    ],
    controllers: [AppController],
  })
  class TestAppModule {
  }

  const app = await NestFactory.create(TestAppModule);
// Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Http Remote PC control API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  await writeFile('./swagger.json', JSON.stringify(document, null, 2));
}

void bootstrap();
