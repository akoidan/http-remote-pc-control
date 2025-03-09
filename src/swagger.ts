import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import {AppModule} from '@/app/app.module';
import {writeFile} from 'fs/promises';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Http Remote PC controll API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  await writeFile('./swagger.json', JSON.stringify(document, null, 2));
  await app.close();
}

void bootstrap();
