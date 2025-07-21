import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlogManagerModule } from 'src/app/blog-manager/blog-manager.module';
import {
  BlogJobWorker,
  EmailJobWorker,
  MailService,
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
  ],
  exports: [MailService, EmailJobWorker, BlogJobWorker, UploadService],
})
export class GlobalModule {}
