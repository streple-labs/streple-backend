/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable } from '@nestjs/common';
import { defineWorker, JobStatus, Job as plainJob } from 'plainjob';
import { EmailJob } from 'src/global/common';
import { MailService, template } from '../mail';
import { JobQueueService } from './job.queue.service';
import { EmailCenterService } from 'src/app/email-center/email-center.service';
import { EmailStatus } from 'src/app/email-center/interface';

export type Job = plainJob & {
  data: {
    emailId: string;
    users: { email: string; fullName: string }[];
    template: template;
    subject: string;
    context: Record<string, any>;
  };
};

@Injectable()
export class EmailJobWorker {
  private readonly jobQueueService = new JobQueueService();
  constructor(
    private readonly mailService: MailService,
    private readonly emailService: EmailCenterService,
  ) {}

  private readonly worker = defineWorker(
    'send-email',
    async (job: Job) => {
      await this.sendEmail(job.data);
    },
    {
      queue: this.jobQueueService.jobQueue,
      onCompleted: async (job: Job) => {
        const data: EmailJob =
          typeof job.data === 'string' ? await JSON.parse(job.data) : job.data;
        await this.emailService.update(
          { id: data.emailId },
          {
            status: EmailStatus.sent,
          },
        );
        console.log(`✅ Job ${job.id} completed`);
      },
      onFailed: async (job: Job, error) => {
        const data: EmailJob =
          typeof job.data === 'string' ? await JSON.parse(job.data) : job.data;
        await this.emailService.update(
          { id: data.emailId },
          {
            status: EmailStatus.failed,
            error,
          },
        );
        console.error(`❌ Job ${job.id} failed: ${error}`);
      },
      pollIntervall: 5000,
      logger: {
        info() {},
        error(message) {
          console.error(message);
        },
        warn() {},
        debug() {},
      },
    },
  );

  async start() {
    await this.worker.start();
  }

  async stop() {
    await this.worker.stop();
    this.jobQueueService.jobQueue.close();
  }

  scheduleEmail(data: EmailJob) {
    this.jobQueueService.jobQueue.add('send-email', data);
  }

  scheduleDelayedEmail(data: EmailJob, delayMs: number) {
    this.jobQueueService.jobQueue.add('send-email', data, { delay: delayMs });
  }

  managingJob() {
    // Count pending jobs
    const pendingCount = this.jobQueueService.jobQueue.countJobs({
      status: JobStatus.Pending,
    });

    // Get job types
    const types = this.jobQueueService.jobQueue.getJobTypes();

    // Get scheduled jobs
    const scheduledJobs = this.jobQueueService.jobQueue.getScheduledJobs();

    console.log({ pendingCount, types, scheduledJobs });
  }

  private async sendEmail(data: string | EmailJob): Promise<void> {
    let email: EmailJob;

    try {
      email = typeof data === 'string' ? JSON.parse(data) : data;

      if (!email.users || !Array.isArray(email.users)) {
        throw new Error('Invalid email job: missing users array');
      }

      const batchSize = 10;
      const maxRetries = 3;

      for (let i = 0; i < email.users.length; i += batchSize) {
        const batch = email.users.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (user) => {
            let attempt = 0;
            while (attempt < maxRetries) {
              try {
                await this.mailService.sendMail(
                  user.email,
                  email.template,
                  email.subject,
                  { ...email.context, fullName: user.fullName },
                  true,
                );
                return; // success
              } catch (err) {
                attempt++;
                console.error(
                  `Failed to send to ${user.email}, attempt ${attempt}:`,
                  err,
                );

                if (attempt < maxRetries) {
                  // Exponential backoff before retry
                  await new Promise((res) => setTimeout(res, 1000 * attempt));
                } else {
                  throw err; // rethrow so Promise.allSettled marks it as rejected
                }
              }
            }
          }),
        );

        // Gather failed sends for logging or further action
        const failed = results
          .map((r, idx) => (r.status === 'rejected' ? batch[idx] : null))
          .filter(Boolean);

        if (failed.length > 0) {
          console.error(
            `Batch ${i / batchSize + 1} failures:`,
            failed.map((u) => u?.email),
          );
          // You could push these into a queue for later retry
        }
      }
    } catch (error) {
      console.error('Error processing email job:', error);
      throw error;
    }
  }
}
