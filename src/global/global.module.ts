import { TradesModule } from '@app/trades/trades.module';
import { HttpModule } from '@nestjs/axios';
import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { EmailCenterModule } from 'src/app/email-center/email-center.module';
import {
  FileProcessorService,
  HtmlChunkerService,
  HttpClientService,
  MailService,
  SanitizeService,
  UploadService,
  WebSocketService,
} from './services';

@Global()
@Module({
  imports: [
    ConfigModule,
    DiscoveryModule,
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
    UploadService,
    SanitizeService,
    FileProcessorService,
    HtmlChunkerService,
    HttpClientService,
    WebSocketService,
  ],
  exports: [
    MailService,
    UploadService,
    SanitizeService,
    FileProcessorService,
    HtmlChunkerService,
    HttpClientService,
    WebSocketService,
  ],
})
export class GlobalModule {}
