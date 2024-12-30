import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import {
  Controller,
  Get,
  Module
} from '@nestjs/common';


@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello from NestJS mTLS server!';
  }
}


@Module({
  controllers: [AppController],
})
export class AppModule {

}

async function bootstrap() {


  // Create the HTTPS server with mTLS
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key:  fs.readFileSync(path.join(__dirname,('server-key.pem'))), // Server private key
      cert: fs.readFileSync(path.join(__dirname,('server-cert.pem'))), // Server certificate
      ca: fs.readFileSync(path.join(__dirname,('ca-cert.pem'))), // CA certificate for verifying client certificates
      requestCert: true, // Request a client certificate
      rejectUnauthorized: true, // Reject connections without a valid client certificate
    }
  });

  await app.listen(8443);
  console.log('HTTPS server with mTLS is running on https://localhost:8443');
}

bootstrap();
