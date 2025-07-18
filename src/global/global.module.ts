import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  BlogJobWorker,
  EmailJobWorker,
  MailService,
  SchedulerService,
} from './services';
@Global()
@Module({
  imports: [ConfigModule],
  providers: [MailService, EmailJobWorker, SchedulerService, BlogJobWorker],
  exports: [MailService, EmailJobWorker, BlogJobWorker],
})
export class GlobalModule {}
