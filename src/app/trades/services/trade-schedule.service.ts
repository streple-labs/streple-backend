import { JobQueueService } from '@app/services';
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { defineWorker, Job as plainJob } from 'plainjob';
import { TradesService } from './trades.service';
import { status } from '../input';

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

type traders = plainJob & {
  data: copyTrade;
};

const trading = 'trades';
const copyTrade = 'copyTrades';
const follower = 'sendNotificationToFollowers';

@Injectable()
export class TradeJobWorker implements OnModuleInit, OnModuleDestroy {
  private readonly jobQueueService = new JobQueueService();
  constructor(
    @Inject(forwardRef(() => TradesService))
    private readonly tradeService: TradesService,
  ) {}

  onModuleInit() {
    this.tradingWorkerStart().catch((err) => {
      console.error('Trade working not starting: ', err);
      process.exit(1);
    });

    this.startSendingNotification().catch((err) => {
      console.log('Trade Notification sending not working', err);
    });
  }

  onModuleDestroy() {
    this.tradingWorkerStop().catch(() => {
      process.exit(1);
    });

    this.stopSendingNotification().catch(() => {
      process.exit(1);
    });
  }

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

  private async tradingWorkerStart() {
    await this.trading.start();
  }

  async startSendingNotification() {
    await this.sendNotification.start();
  }
  private async tradingWorkerStop() {
    await this.trading.stop();
  }

  async stopSendingNotification() {
    await this.sendNotification.stop();
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
    async (job: traders) => {
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
    async (job: traders) => {
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
}
