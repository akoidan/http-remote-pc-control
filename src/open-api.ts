import {DocumentBuilder, type OpenAPIObject, SwaggerModule} from '@nestjs/swagger';
import {patchNestjsSwagger} from '@anatine/zod-nestjs';
import {readFile, writeFile} from 'fs/promises';
import {KeyboardModule} from '@/keyboard/keyboard-module';
import {MouseModule} from '@/mouse/mouse-module';
import {WindowModule} from '@/window/window-module';
import {MonitorModule} from '@/monitor/monitor-module';
import {ProcessModule} from '@/process/process-module';
import {Native} from '@/native/native-model';
import {AppController} from '@/app/app-controller';
import {NestFactory} from '@nestjs/core';
import {GlobalModule} from '@/global/global-module';
import {Global, Module} from '@nestjs/common';

async function generateSwaggerConfig(): Promise<Omit<OpenAPIObject, 'paths'>> {
  const packageJson = JSON.parse(await readFile('./package.json', 'utf-8'));
  const version: string = packageJson.version;
  return new DocumentBuilder()
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
    .addSecurity('clientCertAuth', {
      type: 'mutualTLS' as any,
      description: 'Client certificate authentication required for secure API communication',
    })
    .addSecurityRequirements('clientCertAuth')
    .addGlobalParameters(
      {
        name: 'x-request-id',
        in: 'header',
        description: 'Unique request identifier for tracking',
        required: false,
        schema: {type: 'string'},
      },
    )
    .build();
}

// Recursively remove exclusiveMinimum keys from the document
function swagger30to31(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(swagger30to31);
  }

  const result: any = {};
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  for (const [key, value] of Object.entries(obj)) {
    if (key !== 'exclusiveMinimum') {
      result[key] = swagger30to31(value);
    }
  }
  return result;
}

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
      MouseModule,
      WindowModule,
      MonitorModule,
      GlobalModule,
      ProcessModule,
    ],
    controllers: [AppController],
  })
  class TestAppModule {
  }

  const app = await NestFactory.create(TestAppModule);
  // Enable Zod -> Swagger support
  patchNestjsSwagger();
  const config = await generateSwaggerConfig();
  config.openapi = '3.1.0';
  const document = SwaggerModule.createDocument(app, config);

  const cleanedDocument = swagger30to31(document);

  await writeFile('./openapi/openapi.json', JSON.stringify(cleanedDocument, null, 2));
}

void bootstrap();
