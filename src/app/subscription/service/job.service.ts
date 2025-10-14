import { JobQueueService } from '@app/services';
import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { defineWorker, Job as plainJob } from 'plainjob';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '../input';

export interface DataInput {
  subscriptionId: string;
  status: SubscriptionStatus;
  reason?: string;
}
type Job = plainJob & {
  data: DataInput;
};
const JobName = 'subscription';

@Injectable()
export class SubscriptionJobService implements OnModuleInit, OnModuleDestroy {
  private readonly jobQueueService = new JobQueueService();
  constructor(
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {}

  onModuleInit() {
    this.SubscriptionJobStart().catch((err) => {
      console.error('Subscription Job on start:', err);
      process.exit(1);
    });
  }

  onModuleDestroy() {
    this.SubscriptionJobStop().catch(() => {
      process.exit(1);
    });
  }

  scheduleStatusEnd(data: DataInput, delay: number) {
    const { id } = this.jobQueueService.jobQueue.add(JobName, data, { delay });
    return id;
  }

  scheduleNoDelay(data: DataInput) {
    const { id } = this.jobQueueService.jobQueue.add(JobName, data);
    return id;
  }

  cancelJob(id: number) {
    return this.jobQueueService.jobQueue.markJobAsDone(id);
  }

  private async createSubscription(data: string | DataInput): Promise<void> {
    let input: DataInput;

    try {
      input = typeof data === 'string' ? await JSON.parse(data) : data;

      await this.subscriptionService.systemUpdate(input);
    } catch (error) {
      console.error('Error processing email job:', error);
      throw error;
    }
  }

  private async SubscriptionJobStart() {
    await this.worker.start();
  }

  private async SubscriptionJobStop() {
    await this.worker.stop();
    this.jobQueueService.jobQueue.close();
  }

  private readonly worker = defineWorker(
    JobName,
    async (job: Job) => {
      await this.createSubscription(job.data);
    },
    {
      queue: this.jobQueueService.jobQueue,
      onCompleted: () => {},
      onFailed: () => {},
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
}
