import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import PgBoss, { Job, WorkHandler } from 'pg-boss';
import { MailService, template } from 'src/global/services';

interface EmailJobData {
  user: { email: string; name?: string };
  subject: string;
  body: string;
}

@Injectable()
export class EmailWorker implements OnModuleInit {
  private readonly logger = new Logger(EmailWorker.name);
  constructor(
    @Inject('PG_BOSS') private readonly boss: PgBoss,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    this.logger.log('📩 EmailWorker initialized');
    const handler: WorkHandler<EmailJobData> = async (
      job: Job<EmailJobData> | Job<EmailJobData>[],
    ) => {
      // Handle both single job and batch processing
      const jobs = Array.isArray(job) ? job : [job];
      console.log(jobs);
      for (const singleJob of jobs) {
        const { user, subject, body } = singleJob.data;

        try {
          await this.mailService.sendMail(
            user.email,
            template.broadcast,
            subject,
            {
              body,
              fullName: user.name,
            },
          );
          this.logger.log(`✅ Email sent to: ${user.email}`);
        } catch (err) {
          this.logger.error(
            `❌ Failed to send email to: ${user.email}`,
            err.stack,
          );
          throw err;
        }
      }
    };

    await this.boss.work<EmailJobData>('send-email', handler);
  }
}
