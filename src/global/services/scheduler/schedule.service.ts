// app.module.ts or main scheduler manager
import { OnModuleInit, OnModuleDestroy, Injectable } from '@nestjs/common';
import { EmailJobWorker } from './job.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly emailJobWorker: EmailJobWorker) {}

  onModuleInit() {
    this.emailJobWorker.start().catch((err) => {
      console.error('Worker failed:', err);
      process.exit(1);
    });
  }

  onModuleDestroy() {
    this.emailJobWorker.stop().catch((err) => {
      console.error('Worker failed', err);
      process.exit(1);
    });
  }
}
