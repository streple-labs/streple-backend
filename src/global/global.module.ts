import { TradesModule } from '@app/trades/trades.module';
import { HttpModule } from '@nestjs/axios';
import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { BlogManagerModule } from 'src/app/blog-manager/blog-manager.module';
import { EmailCenterModule } from 'src/app/email-center/email-center.module';
import {
  BinanceGateway,
  BlogJobWorker,
  EmailJobWorker,
  FileProcessorService,
  HtmlChunkerService,
  HttpClientService,
  MailService,
  PriceBatcherService,
  PriceCache,
  SanitizeService,
  SchedulerService,
  TradeJobWorker,
  UploadService,
  WebSocketService,
} from './services';
import { PriceChecker } from './services/price-fetcher/check.service';
@Global()
@Module({
  imports: [
    ConfigModule,
    DiscoveryModule,
    forwardRef(() => BlogManagerModule),
    forwardRef(() => EmailCenterModule),
    forwardRef(() => TradesModule),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
  ],
  providers: [
    MailService,
    EmailJobWorker,
    SchedulerService,
    BlogJobWorker,
    TradeJobWorker,
    UploadService,
    SanitizeService,
    FileProcessorService,
    HtmlChunkerService,
    HttpClientService,
    WebSocketService,
    PriceCache,
    PriceBatcherService,
    BinanceGateway,
    PriceChecker,
  ],
  exports: [
    MailService,
    EmailJobWorker,
    BlogJobWorker,
    UploadService,
    SanitizeService,
    FileProcessorService,
    HtmlChunkerService,
    TradeJobWorker,
    HttpClientService,
    WebSocketService,
    PriceCache,
    PriceBatcherService,
    BinanceGateway,
  ],
})
export class GlobalModule {}
