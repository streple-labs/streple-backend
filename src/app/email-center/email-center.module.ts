import { Module } from '@nestjs/common';
import * as PgBoss from 'pg-boss';
import { EmailCenterController } from './email-center.controller';
import { EmailCenterService } from './email-center.service';
import { EmailWorker } from './email.worker';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailCenter } from './entities/email-center.entity';
import { BullModule } from '@nestjs/bull';
import { User } from '../users/user.entity';
import { MailService } from 'src/global/services';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailCenter, User]),
    BullModule.registerQueue({ name: 'email' }),
  ],
  controllers: [EmailCenterController],
  providers: [
    {
      provide: 'PG_BOSS',
      useFactory: async () => {
        const boss = new PgBoss({
          connectionString: process.env.DATABASE_URI,
          retentionMinutes: 60 * 24, // keep jobs for 24 hours
          archiveCompletedAfterSeconds: 60, // clean every hour
        });
        boss.on('error', (err) => {
          console.error('PG-Boss error', err);
        });

        boss.on('monitor-states', (states) => {
          console.log('📊 PgBoss States:', states);
        });

        await boss.start();
        console.log('🚀 PG Boss started');
        return boss;
      },
    },
    EmailCenterService,
    // EmailProcessor,
    EmailWorker,
    MailService,
  ],
  exports: ['PG_BOSS', EmailCenterService],
})
export class EmailCenterModule {}
