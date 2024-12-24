import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app/app.module';



async function start(): Promise<void> {
  await NestFactory.createApplicationContext(AppModule);
}

start();
