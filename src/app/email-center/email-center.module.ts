import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/global/services';
import { User } from '../users/user.entity';
import { EmailCenterController } from './email-center.controller';
import { EmailCenterService } from './email-center.service';
import { EmailCenter } from './entities/email-center.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailCenter, User])],
  controllers: [EmailCenterController],
  providers: [EmailCenterService, MailService],
  exports: [EmailCenterService],
})
export class EmailCenterModule {}
