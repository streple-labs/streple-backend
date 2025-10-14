import { Injectable } from '@nestjs/common';
import { better, defineQueue } from 'plainjob';
import * as Database from 'better-sqlite3';

@Injectable()
export class JobQueueService {
  private readonly connection = better(new Database('streple_jobs.db'));

  readonly jobQueue = defineQueue({
    connection: this.connection,
    timeout: 30 * 60 * 1000,
    removeDoneJobsOlderThan: 1 * 24 * 60 * 60 * 1000,
    removeFailedJobsOlderThan: 3 * 24 * 60 * 60 * 1000,
    logger: {
      info() {},
      error(message) {
        console.error(message);
      },
      warn() {},
      debug() {},
    },
  });
}
