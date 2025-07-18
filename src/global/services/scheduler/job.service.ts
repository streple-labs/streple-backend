import { Injectable } from '@nestjs/common';
import {
  better,
  defineQueue,
  defineWorker,
  JobStatus,
  Job as plainJob,
} from 'plainjob';
import { MailService, template } from '../mail';
import { EmailJob } from 'src/global/common';
import * as Database from 'better-sqlite3';

export type Job = plainJob & {
  data: {
    users: { email: string; fullName: string }[];
    template: template;
    subject: string;
    context: Record<string, any>;
  };
};

@Injectable()
export class EmailJobWorker {
  constructor(private readonly mailService: MailService) {}

  private readonly connection = better(new Database('streple_jobs.db'));
  private readonly jobQueue = defineQueue({
    connection: this.connection,
    timeout: 30 * 60 * 1000,
    removeDoneJobsOlderThan: 7 * 24 * 60 * 60 * 1000,
    removeFailedJobsOlderThan: 30 * 24 * 60 * 60 * 1000,
    logger: {
      info() {},
      error(message) {
        console.error(message);
      },
      warn() {},
      debug() {},
    },
  });

  private readonly worker = defineWorker(
    'send-email',
    async (job: Job) => {
      await this.sendEmail(job.data);
    },
    {
      queue: this.jobQueue,
      onCompleted: (job) => console.log(`✅ Job ${job.id} completed`),
      onFailed: (job, error) =>
        console.error(`❌ Job ${job.id} failed: ${error}`),
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
    this.jobQueue.close();
  }

  scheduleEmail(data: EmailJob) {
    this.jobQueue.add('send-email', data);
  }

  scheduleDelayedEmail(data: EmailJob, delayMs: number) {
    this.jobQueue.add('send-email', data, { delay: delayMs });
  }

  managingJob() {
    // Count pending jobs
    const pendingCount = this.jobQueue.countJobs({ status: JobStatus.Pending });

    // Get job types
    const types = this.jobQueue.getJobTypes();

    // Get scheduled jobs
    const scheduledJobs = this.jobQueue.getScheduledJobs();

    console.log({ pendingCount, types, scheduledJobs });
  }

  private async sendEmail(data: string | EmailJob): Promise<void> {
    let email: EmailJob;

    try {
      email = typeof data === 'string' ? await JSON.parse(data) : data;

      if (!email.users || !Array.isArray(email.users)) {
        throw new Error('Invalid email job: missing users array');
      }

      console.log(email);
      for (const user of email.users) {
        await this.mailService.sendMail(
          user.email,
          email.template,
          email.subject,
          { ...email.context, fullName: user.fullName },
        );
      }
    } catch (error) {
      console.error('Error processing email job:', error);
      throw error;
    }
  }
}
