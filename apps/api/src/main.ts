import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { ApiErrorFilter } from './common/api-error.filter.js';
import { requestId } from './common/request-id.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set(
    process.env.NODE_ENV === 'production'
      ? configuredOrigins
      : [
          ...configuredOrigins,
          'http://localhost:4200',
          'http://127.0.0.1:4200',
        ],
  );
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(requestId);
  app.enableCors({
    origin: [...allowedOrigins],
    credentials: true,
  });
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const origin = req.get('origin');
    if (
      ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) &&
      origin &&
      !allowedOrigins.has(origin)
    )
      return next(
        new ForbiddenException({
          code: 'INVALID_REQUEST_ORIGIN',
          message: 'El origen de la solicitud no está permitido.',
        }),
      );
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
