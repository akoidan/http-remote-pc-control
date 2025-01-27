import {NestFactory} from '@nestjs/core';
import {AppModule} from '@/app/app.module';
import {
  asyncLocalStorage,
  CustomLogger,
} from '@/app/custom-logger';
import * as process from 'node:process';


asyncLocalStorage.run(new Map().set('comb', 'init'), () => {
  const customLogger = new CustomLogger();
  NestFactory.createApplicationContext(AppModule, {
    logger: customLogger,
  }).catch((err: unknown) => {
    customLogger.error((err as Error)?.message ?? err, (err as Error)?.stack);
    process.exit(1);
  });
});
