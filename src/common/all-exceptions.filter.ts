import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// Responde TODOS los errores con la misma forma:
// { statusCode, message, path, timestamp }
@Catch() // sin nada dentro: atrapa cualquier error
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR; // 500, salvo que sepamos otra cosa
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      // Errores "conocidos": 400, 401, 403, 404, 409, 429...
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ??
            exception.message);
    } else {
      // Errores nuestros (por ejemplo, PostgreSQL parado): la traza, solo en la consola
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
