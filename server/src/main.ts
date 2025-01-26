import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {CustomLogger} from '@/app/custom-logger';

async function start(): Promise<void> {
  await NestFactory.createApplicationContext(AppModule, {
    logger: new CustomLogger(),
  });
}

void start();
