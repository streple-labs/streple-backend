import { Injectable } from '@nestjs/common';
import { defineWorker, Job as plainJob } from 'plainjob';
import { JobQueueService } from './job.queue.service';
import { BlogManagerService } from 'src/app/blog-manager/blog-manager.service';
import { blogStatus } from 'src/app/blog-manager/interface';

interface post {
  id: string;
}

type Job = plainJob & {
  data: {
    id: string;
  };
};
const jobType = 'post-blog';

@Injectable()
export class BlogJobWorker {
  private readonly jobQueueService = new JobQueueService();
  constructor(private readonly blogService: BlogManagerService) {}

  private readonly worker = defineWorker(
    jobType,
    async (job: Job) => {
      await this.postBlog(job.data);
    },
    {
      queue: this.jobQueueService.jobQueue,
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
    this.jobQueueService.jobQueue.close();
  }

  scheduleDelayedEmail(data: post, delayMs: number) {
    this.jobQueueService.jobQueue.add(jobType, data, { delay: delayMs });
  }

  private async postBlog(data: string | post): Promise<void> {
    let blog: post;

    try {
      blog = typeof data === 'string' ? await JSON.parse(data) : data;

      await this.blogService.update(blog, { status: blogStatus.publish });
    } catch (error) {
      console.error('Error processing email job:', error);
      throw error;
    }
  }
}
