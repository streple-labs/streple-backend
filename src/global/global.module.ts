import { Capabilities } from '@app/users/entity';
import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogManagerModule } from 'src/app/blog-manager/blog-manager.module';
import { EmailCenterModule } from 'src/app/email-center/email-center.module';
import {
  BlogJobWorker,
  CapabilitiesSyncService,
  EmailJobWorker,
  FileProcessorService,
  HtmlChunkerService,
  MailService,
  SanitizeService,
  SchedulerService,
  UploadService,
} from './services';
@Global()
@Module({
  imports: [
    ConfigModule,
    DiscoveryModule,
    forwardRef(() => BlogManagerModule),
    forwardRef(() => EmailCenterModule),
    TypeOrmModule.forFeature([Capabilities]),
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
    CapabilitiesSyncService,
  ],
  exports: [
    MailService,
    EmailJobWorker,
    BlogJobWorker,
    UploadService,
    SanitizeService,
    FileProcessorService,
    HtmlChunkerService,
    CapabilitiesSyncService,
  ],
})
export class GlobalModule {}
