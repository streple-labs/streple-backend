import { JobQueueService } from '@app/services';
import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { defineWorker, Job as plainJob } from 'plainjob';
import { BlogManagerService } from './blog-manager.service';
import { blogStatus } from '../interface';

interface post {
  id: string;
}

type Job = plainJob & {
  data: post;
};
const jobType = 'post-blog';

@Injectable()
export class BlogScheduleService implements OnModuleInit, OnModuleDestroy {
  private readonly jobQueueService = new JobQueueService();
  constructor(
    @Inject(forwardRef(() => BlogManagerService))
    private readonly blogService: BlogManagerService,
  ) {}

  onModuleInit() {
    this.blogWorkerStart().catch((err) => {
      console.error('Blog worker not start:', err);
      process.exit(1);
    });
  }

  onModuleDestroy() {
    this.blogWorkerStop().catch(() => {
      process.exit(1);
    });
  }

  scheduleDelayedEmail(data: post, delayMs: number) {
    this.jobQueueService.jobQueue.add(jobType, data, { delay: delayMs });
  }

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

  private async blogWorkerStart() {
    await this.worker.start();
  }

  private async blogWorkerStop() {
    await this.worker.stop();
    this.jobQueueService.jobQueue.close();
  }
}
