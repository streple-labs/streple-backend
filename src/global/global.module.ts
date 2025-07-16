import { Module } from '@nestjs/common';
import { MailService } from './services';

@Module({
  imports: [],
  providers: [MailService],
  exports: [MailService],
})
export class GlobalModule {}
