import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailJobWorker, MailService, SchedulerService } from './services';
@Global()
@Module({
  imports: [ConfigModule],
  providers: [MailService, EmailJobWorker, SchedulerService],
  exports: [MailService, EmailJobWorker],
})
export class GlobalModule {}
