import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {Logger} from 'nestjs-pino';
import {ValidationPipe} from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {bufferLogs: true});
  app.useGlobalPipes(new ValidationPipe());
  app.useLogger(app.get(Logger));
  await app.listen(5000);
}

bootstrap().catch((e: unknown) => {
  console.error(e); // eslint-disable-line no-console
  process.exit(98); // force electron to close
});
