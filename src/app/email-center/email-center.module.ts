import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/global/services';
import { User } from '../users/entity/user.entity';
import { EmailCenterController } from './email-center.controller';
import { EmailCenterService } from './email-center.service';
import { GlobalModule } from 'src/global/global.module';
import { EmailCenter, WaitList } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailCenter, User, WaitList]),
    forwardRef(() => GlobalModule),
  ],
  controllers: [EmailCenterController],
  providers: [EmailCenterService, MailService],
  exports: [EmailCenterService],
})
export class EmailCenterModule {}
