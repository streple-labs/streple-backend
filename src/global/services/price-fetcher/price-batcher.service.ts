import { JobQueueService } from '@app/services/scheduler/job.queue.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { defineWorker } from 'plainjob';
import { PriceCache } from './price-caches';

@Injectable()
export class PriceBatcherService {
  private readonly jobQueueService = new JobQueueService();
  constructor(private readonly cache: PriceCache) {}

  // onModuleInit() {
  //   void defineWorker(
  //     'flushPrices',
  //     () => {
  //       const snapshot = this.cache.drain();
  //       if (!Object.keys(snapshot).length) return;
  //       // Example: bulk-upsert
  //       this.upsertMany(snapshot);
  //     },
  //     {
  //       queue: this.jobQueueService.jobQueue,
  //       onCompleted: (job) => console.log(`✅ Job ${job.id} completed`),
  //       onFailed: (job, error) =>
  //         console.error(`❌ Job ${job.id} failed: ${error}`),
  //       pollIntervall: 5000,
  //       logger: {
  //         info() {},
  //         error(message) {
  //           console.error(message);
  //         },
  //         warn() {},
  //         debug() {},
  //       },
  //     },
  //   ).start();

  //   /* 2. Kick-off the first flush */
  //   this.jobQueueService.jobQueue.add('flushPrices', {});
  // }

  // private upsertMany(prices: Record<string, number>) {
  //   // Replace with your ORM / query-builder
  //   console.log('💾 flushing', prices);
  // }
}
