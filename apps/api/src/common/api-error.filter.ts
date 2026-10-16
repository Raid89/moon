import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? (payload as { message: unknown }).message
        : 'No pudimos completar la solicitud.';
    const code =
      typeof payload === 'object' && payload && 'code' in payload
        ? (payload as { code: string }).code
        : status === 500
          ? 'INTERNAL_ERROR'
          : 'REQUEST_FAILED';
    response.status(status).json({ code, message, requestId: request.id });
  }
}
