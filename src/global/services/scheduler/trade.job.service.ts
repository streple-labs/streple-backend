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

interface copyTrade {
  tradeId: string;
  creatorId: string;
}

type CopyJob = plainJob & {
  data: copyTrade;
};

type notification = plainJob & {
  data: copyTrade;
};

const trading = 'trades';
const copyTrade = 'copyTrades';
const follower = 'sendNotificationToFollowers';

@Injectable()
export class TradeJobWorker {
  private readonly jobQueueService = new JobQueueService();
  constructor(private readonly tradeService: TradesService) {}

  private readonly trading = defineWorker(
    trading,
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

  private readonly copyTrades = defineWorker(
    copyTrade,
    async (job: CopyJob) => {
      await this.handleCopyTrade(job.data);
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

  private readonly sendNotification = defineWorker(
    follower,
    async (job: notification) => {
      await this.handleSendNotification(job.data);
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
    await this.trading.start();
  }

  async startSendingNotification() {
    await this.sendNotification.start();
  }

  // async startCopyTrading() {
  //   await this.copyTrades.start();
  // }

  async stop() {
    await this.trading.stop();
    this.jobQueueService.jobQueue.close();
  }

  async stopSendingNotification() {
    await this.sendNotification.stop();
  }

  // async stopCopyTrading() {
  //   await this.copyTrades.stop();
  //   this.jobQueueService.jobQueue.close();
  // }

  scheduleTrade(data: trade, delay: number) {
    const JobId = this.jobQueueService.jobQueue.add(trading, data, { delay });
    return JobId.id;
  }

  scheduleCopyTrade(data: copyTrade) {
    const jobId = this.jobQueueService.jobQueue.add(copyTrade, data);
    return jobId;
  }

  sendNotificationToFollowers(data: copyTrade) {
    const { id } = this.jobQueueService.jobQueue.add(follower, data);
    return id;
  }

  closeJob(jobId: number) {
    return this.jobQueueService.jobQueue.markJobAsDone(jobId);
  }

  private async handleCopyTrade(data: string | copyTrade): Promise<void> {
    let details: copyTrade;
    try {
      details = typeof data === 'string' ? await JSON.parse(data) : data;
      console.log(details);
      // await this.tradeService.copyTradeBatch(details);
    } catch (error) {
      console.error('Error processing Trade job:', error);
      throw error;
    }
  }

  private async handleSendNotification(
    data: string | copyTrade,
  ): Promise<void> {
    let details: copyTrade;
    try {
      details = typeof data === 'string' ? await JSON.parse(data) : data;

      await this.tradeService.sendNotificationJob(details);
    } catch (error) {
      console.error('Error processing Trade job:', error);
      throw error;
    }
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
