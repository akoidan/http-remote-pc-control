import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/event/app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe());
  app.useLogger(app.get(Logger));
  await app.listen(5000);
}

bootstrap().catch(e => {
  console.error(e);
  process.exit(98) // force electron to close
});
