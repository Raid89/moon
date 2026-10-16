import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { ApiErrorFilter } from './common/api-error.filter.js';
import { requestId } from './common/request-id.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(requestId);
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:4200',
    credentials: true,
  });
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const origin = req.get('origin');
    if (
      ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) &&
      origin &&
      origin !== (process.env.WEB_ORIGIN ?? 'http://localhost:4200')
    )
      return next(new Error('Invalid request origin'));
    return next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiErrorFilter());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
