import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/global/services';
import { User } from '../users/entity/user.entity';
import { EmailCenterController } from './email-center.controller';
import { GlobalModule } from 'src/global/global.module';
import { EmailCenter, WaitList } from './entities';
import { EmailCenterService, EmailJobWorker } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailCenter, User, WaitList]),
    forwardRef(() => GlobalModule),
  ],
  controllers: [EmailCenterController],
  providers: [EmailCenterService, MailService, EmailJobWorker],
  exports: [EmailCenterService, EmailJobWorker],
})
export class EmailCenterModule {}
