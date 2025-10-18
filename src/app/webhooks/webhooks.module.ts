import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebhookMiddleware } from './webhook.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebHookLog } from './entity';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([WebHookLog]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WebhookMiddleware).forRoutes('webhooks'); // Apply to all webhook routes
  }
}
