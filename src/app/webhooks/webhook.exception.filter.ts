import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class WebhookExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logError(exception, request);

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({
        statusCode: exception.getStatus(),
        message: exception.message,
      });
    } else {
      // Don't expose internal errors to third parties
      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }

  private logError(exception: unknown, request: Request) {
    console.error('Webhook error:', {
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      error: exception,
    });
  }
}
