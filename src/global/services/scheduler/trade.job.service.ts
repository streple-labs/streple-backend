import { Injectable } from '@nestjs/common';
import { defineWorker, Job as plainJob } from 'plainjob';
import { JobQueueService } from './job.queue.service';
import { TradesService } from '@app/trades/services';
import { status } from '@app/trades/input';

interface trade {
  identifier: string;
  type: 'starting' | 'expiring';
}

type Job = plainJob & {
  data: trade;
};

const jobType = 'trades';

@Injectable()
export class TradeJobWorker {
  private readonly jobQueueService = new JobQueueService();
  constructor(private readonly tradeService: TradesService) {}

  private readonly worker = defineWorker(
    jobType,
    async (job: Job) => {
      await this.handleTrade(job.data);
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

  scheduleTrade(data: trade, delay: number) {
    const JobId = this.jobQueueService.jobQueue.add(jobType, data, { delay });
    return JobId.id;
  }

  closeJob(jobId: number) {
    return this.jobQueueService.jobQueue.markJobAsDone(jobId);
  }

  private async handleTrade(data: string | trade): Promise<void> {
    let details: trade;

    try {
      details = typeof data === 'string' ? await JSON.parse(data) : data;

      await this.tradeService.systemUpdate(
        { identifier: details.identifier },
        details.type,
        { status: status.close },
      );
    } catch (error) {
      console.error('Error processing Trade job:', error);
      throw error;
    }
  }
}
