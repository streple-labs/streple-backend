import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config();
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

if (!process.env.PORT) {
  throw new Error('Missing PORT in environment variables');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.use(cookieParser()); // Required for reading cookies

  app.enableCors({
    origin: [
      'https://streple.com',
      'https://www.streple.com',
      'https://solace.streple.com',
      'https://app.streple.com',
      'https://mission.streple.com',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    credentials: true, // allow cookies or Authorization headers
  });

  const config = new DocumentBuilder()
    .setTitle('Streple Copy-Trading API')
    .setDescription('Demo trading & copy-trading endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
