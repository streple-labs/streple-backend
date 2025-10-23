import { AuthUser } from '@app/common';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JobQueueService } from '@app/services';
import { defineWorker, Job as plainJob } from 'plainjob';
import { USDCService } from '@app/wallets/service';

const JobName = 'create-crypto-account';
type Job = plainJob & {
  data: AuthUser;
};

@Injectable()
export class UserScheduleService implements OnModuleInit, OnModuleDestroy {
  private readonly jobQueueService = new JobQueueService();
  constructor(private readonly usdcService: USDCService) {}

  onModuleInit() {
    this.cryptoWorkerStart().catch((err) => {
      console.error('Blog worker not start:', err);
      process.exit(1);
    });
  }

  onModuleDestroy() {
    this.cryptoWorkerStop().catch(() => {
      process.exit(1);
    });
  }

  createCryptoAccount(data: AuthUser, delay: number) {
    this.jobQueueService.jobQueue.add(JobName, data, { delay });
  }

  private readonly worker = defineWorker(
    JobName,
    async (job: Job) => {
      await this.usdcService.createWalletForUser(job.data);
    },
    {
      queue: this.jobQueueService.jobQueue,
      onCompleted: (job) => console.log(`Job ${job.id} completed`),
      onFailed: (job, error) => console.error(`Job ${job.id} failed: ${error}`),
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

  private async cryptoWorkerStart() {
    await this.worker.start();
  }

  private async cryptoWorkerStop() {
    await this.worker.stop();
    this.jobQueueService.jobQueue.close();
  }
}
