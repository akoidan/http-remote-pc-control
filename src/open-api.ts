import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {patchNestjsSwagger} from '@anatine/zod-nestjs';
import {readFile, writeFile} from 'fs/promises';
import {KeyboardModule} from '@/keyboard/keyboard-module';
import {ExecuteModule} from '@/execute/execute-module';
import {MouseModule} from '@/mouse/mouse-module';
import {WindowModule} from '@/window/window-module';
import {MonitorModule} from '@/monitor/monitor-module';
import {ProcessModule} from '@/process/process-module';
import {Native} from '@/native/native-model';
import {AppController} from '@/app/app-controller';
import {NestFactory} from '@nestjs/core';
import {Global, Module} from '@nestjs/common';

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
  // Enable Zod -> Swagger support
  patchNestjsSwagger();
  const packageJson = JSON.parse(await readFile('./package.json', 'utf-8'));
  const version: string = packageJson.version;
// Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Http Remote PC Control API')
    .setDescription('API Documentation for remote controlling a PC via HTTP')
    .setVersion(version)
    .addServer('https://{host}:{port}', 'Custom Server', {
      host: {
        default: 'localhost',
        description: 'The host address of the server',
      },
      port: {
        default: '5000',
        description: 'The port the server is running on',
      },
    })
    .addGlobalParameters(
      {
        name: 'x-request-id',
        in: 'header',
        description: 'Unique request identifier for tracking',
        required: false,
        schema: { type: 'string' },
      },
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  await writeFile('./openapi/openapi.json', JSON.stringify(document, null, 2));
}

void bootstrap();
