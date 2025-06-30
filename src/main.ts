import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config();
import * as cookieParser from 'cookie-parser';

if (!process.env.PORT) {
  throw new Error('Missing PORT in environment variables');
}

if (!process.env.CORS_ORIGINS) {
  throw new Error('Missing CORS_ORIGINS in environment variables');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(cookieParser()); // Required for reading cookies

  const CORS_ORIGINS = process.env.CORS_ORIGINS as string; // TODO: remove localhost when about to go live
  const allowedOrigins = CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
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
bootstrap();
