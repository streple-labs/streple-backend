import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WebhookMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WebhookMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Log incoming webhook
    this.logger.log(
      `Webhook received: ${req.method} ${req.url} from ${req.ip}`,
    );

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // Validate origin for specific webhooks
    if (this.requiresOriginValidation(req)) {
      const origin = req.headers.origin;
      if (origin && !this.isAllowedOrigin(origin)) {
        this.logger.warn(`Blocked webhook from unauthorized origin: ${origin}`);
        return res.status(403).json({ error: 'Origin not allowed' });
      }
    }

    // Measure response time
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `Webhook processed: ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  }

  private requiresOriginValidation(req: Request): boolean {
    // Only validate origin for specific sensitive webhooks
    const sensitivePaths = ['/webhooks/circle'];
    return sensitivePaths.some((path) => req.path.startsWith(path));
  }

  private isAllowedOrigin(origin: string): boolean {
    const allowedOrigins =
      process.env.ALLOWED_WEBHOOK_ORIGINS?.split(',') || [];
    return allowedOrigins.includes(origin);
  }
}
