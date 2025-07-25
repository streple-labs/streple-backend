import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlogManagerModule } from 'src/app/blog-manager/blog-manager.module';
import {
  BlogJobWorker,
  EmailJobWorker,
  FileProcessorService,
  HtmlChunkerService,
  MailService,
  SanitizeService,
  SchedulerService,
  UploadService,
} from './services';
import { EmailCenterModule } from 'src/app/email-center/email-center.module';
@Global()
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => BlogManagerModule),
    forwardRef(() => EmailCenterModule),
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
  ],
  exports: [
    MailService,
    EmailJobWorker,
    BlogJobWorker,
    UploadService,
    SanitizeService,
    FileProcessorService,
    HtmlChunkerService,
  ],
})
export class GlobalModule {}
