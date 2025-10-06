import { Response } from 'express';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';

@Catch()
export class AllExpectionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';

    if (exception instanceof EntityNotFoundError) {
      status = 404;
      message = exception.message || 'Cущность не найдена';
    }

    if (exception?.code === '23505') {
      status = 409;
      message = 'Ошибка дубликата записи';
    }

    if (exception instanceof PayloadTooLargeException) {
      status = 413;
      message = 'Файл слишком большой';
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    return res.status(status).json({
      statusCode: status,
      message,
    });
  }
}
