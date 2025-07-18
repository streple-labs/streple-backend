// // eslint-disable-next-line @typescript-eslint/no-require-imports
// const Database = require('better-sqlite3');
// import { better, defineQueue, defineWorker } from 'plainjob';
// import { EmailJob } from 'src/global/common';

// // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
// const connection = better(new Database('streple_jobs.db'));

// export const jobQueue = defineQueue({
//   connection,
//   timeout: 30 * 60 * 1000, // 30 minutes
//   removeDoneJobsOlderThan: 7 * 24 * 60 * 60 * 1000, // 7 days
//   removeFailedJobsOlderThan: 30 * 24 * 60 * 60 * 1000, // 30 days
// });

// // Define worker
// export const sendEmailWorker = defineWorker(
//   'send-email',
//   (job: EmailJob) => {
//     sendEmail(job.data); // Replace with your real email logic
//   },
//   {
//     queue: jobQueue,
//     onCompleted: (job) => console.log(`✅ Job ${job.id} completed`),
//     onFailed: (job, error) =>
//       console.error(`❌ Job ${job.id} failed: ${error}`),
//   },
// );

// // Dummy email logic (replace with actual)
// function sendEmail(to: string, subject: string) {
//   console.log(`📧 Sending email to ${to} with subject "${subject}"`);
// }

// src/global/services/scheduler/email.worker.ts

// // src/job/job.service.ts
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { jobQueue, sendEmailWorker } from './job.queue';

// @Injectable()
// export class JobService implements OnModuleInit, OnModuleDestroy {
//   //   async onModuleInit() {
//   //     await sendEmailWorker.start(); // Start worker when module is ready
//   //   }

//   //   async onModuleDestroy() {
//   //     await sendEmailWorker.stop(); // Gracefully stop worker
//   //     jobQueue.close(); // Close DB
//   //   }

//   scheduleEmail(to: string, subject: string) {
//     jobQueue.add('send-email', { to, subject });
//   }

//   scheduleDelayedEmail(to: string, subject: string, delayMs: number) {
//     jobQueue.add('send-email', { to, subject }, { delay: delayMs });
//   }

//   scheduleDailyReport() {
//     jobQueue.schedule('daily-report', { cron: '0 0 * * *' }); // every midnight
//   }
// }
