import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { BlogManagerModule } from 'src/app/blog-manager/blog-manager.module';
import { EmailCenterModule } from 'src/app/email-center/email-center.module';
import {
  BlogJobWorker,
  EmailJobWorker,
  FileProcessorService,
  WebSocketService,
  HtmlChunkerService,
  HttpClientService,
  MailService,
  SanitizeService,
  SchedulerService,
  UploadService,
} from './services';
import { HttpModule } from '@nestjs/axios';
@Global()
@Module({
  imports: [
    ConfigModule,
    DiscoveryModule,
    forwardRef(() => BlogManagerModule),
    forwardRef(() => EmailCenterModule),
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
    UploadService,
    SanitizeService,
    FileProcessorService,
    HtmlChunkerService,
    HttpClientService,
    WebSocketService,
  ],
  exports: [
    MailService,
    EmailJobWorker,
    BlogJobWorker,
    UploadService,
    SanitizeService,
    FileProcessorService,
    HtmlChunkerService,
    HttpClientService,
    WebSocketService,
  ],
})
export class GlobalModule {}
