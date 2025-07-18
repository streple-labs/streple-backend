import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import PgBoss, { WorkHandler, WorkOptions } from 'pg-boss';
import { MailService, template } from 'src/global/services';
import { QUEUE_NAME } from './email-center.service';

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
    this.logger.log('📩 Initializing EmailWorker');

    try {
      // Verify subscription
      const queues = await this.boss.getQueues();
      const queueNames = queues.map((q) => q.name);
      this.logger.log('Available queues:', queueNames);

      if (!queueNames.includes(QUEUE_NAME)) {
        this.logger.warn('send-email queue not found, creating subscription');
      }

      const handler: WorkHandler<EmailJobData> = async (jobOrJobs) => {
        const jobs = Array.isArray(jobOrJobs) ? jobOrJobs : [jobOrJobs];

        for (const job of jobs) {
          try {
            this.logger.log(`Processing job ${job.id}`);
            const { user, subject, body } = job.data;

            await this.mailService.sendMail(
              user.email,
              template.broadcast,
              subject,
              { body, fullName: user.name },
            );

            this.logger.log(`✅ Email sent to ${user.email}`);
          } catch (error) {
            this.logger.error(
              `❌ Failed to process job ${job.id}:`,
              error.stack,
            );
            throw error;
          }
        }
      };

      await this.boss.work<EmailJobData>(
        QUEUE_NAME,
        {
          teamSize: 2,
          teamConcurrency: 2,
          batchSize: 1,
        } as WorkOptions,
        handler,
      );

      this.logger.log('👂 Worker subscribed to send-email queue');
    } catch (error) {
      this.logger.error('❌ Failed to initialize worker:', error);
      throw error;
    }
  }
}
