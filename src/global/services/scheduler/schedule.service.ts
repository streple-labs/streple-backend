import { OnModuleInit, OnModuleDestroy, Injectable } from '@nestjs/common';
import { EmailJobWorker } from './email.job.service';
import { BlogJobWorker } from './blog.job.service';
import { TradeJobWorker } from './trade.job.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly emailJobWorker: EmailJobWorker,
    private readonly blogJobWorker: BlogJobWorker,
    private readonly tradeJobWorker: TradeJobWorker,
  ) {}

  onModuleInit() {
    this.emailJobWorker.start().catch((err) => {
      console.error('Email Worker failed:', err);
      process.exit(1);
    });

    this.blogJobWorker.start().catch((err) => {
      console.error('Blog Worker failed:', err);
      process.exit(1);
    });

    this.tradeJobWorker.start().catch((err) => {
      console.error('Trade Worker failed', err);
      process.exit(1);
    });

    this.tradeJobWorker.startSendingNotification().catch((err) => {
      console.error('Copy Trade Worker failed', err);
      process.exit(1);
    });
  }

  onModuleDestroy() {
    this.emailJobWorker.stop().catch((err) => {
      console.error('Worker failed', err);
      process.exit(1);
    });

    this.blogJobWorker.stop().catch((err) => {
      console.error('Worker failed', err);
      process.exit(1);
    });

    this.tradeJobWorker.stop().catch((err) => {
      console.error('Trade Worker failed', err);
      process.exit(1);
    });

    this.tradeJobWorker.stopSendingNotification().catch((err) => {
      console.error('Copy Trade Worker failed', err);
      process.exit(1);
    });
  }
}
