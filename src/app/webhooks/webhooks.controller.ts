import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '@app/decorators';
import { WebhookExceptionFilter } from './webhook.exception.filter';

@Public()
@Controller('webhooks')
@ApiExcludeController()
@UseFilters(WebhookExceptionFilter)
export class WebhooksController {
  constructor(private readonly webhookService: WebhooksService) {}

  @Post('circle')
  @HttpCode(HttpStatus.OK)
  async handleCircleWebhook(
    @Body() payload: Buffer,
    @Headers('x-circle-key-id') keyId: string,
    @Headers('x-circle-signature') signature: string,
  ) {
    return this.webhookService.processCircleEvent(payload, keyId, signature);
  }
}
