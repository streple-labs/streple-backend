import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { MailService, template } from 'src/global/services';
import { Jobs } from './interface';

@Processor('email')
export class EmailProcessor {
  constructor(
    private readonly logger = new Logger(EmailProcessor.name),
    private readonly mailService: MailService,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Jobs) {
    const { user, subject, body } = job.data;

    try {
      await this.mailService.sendMail(user.email, template.broadcast, subject, {
        body,
        fullName: user.name,
      });
      this.logger.log(`✅ Email sent to: ${user.email}`);
    } catch (err) {
      this.logger.error(`❌ Failed to send email to: ${user.email}`, err.stack);
      throw err; // triggers retry
    }
  }
}
