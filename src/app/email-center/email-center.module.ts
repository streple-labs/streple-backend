import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/global/services';
import { User } from '../users/user.entity';
import { EmailCenterController } from './email-center.controller';
import { EmailCenterService } from './email-center.service';
import { EmailCenter } from './entities/email-center.entity';
import { GlobalModule } from 'src/global/global.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailCenter, User]),
    forwardRef(() => GlobalModule),
  ],
  controllers: [EmailCenterController],
  providers: [EmailCenterService, MailService],
  exports: [EmailCenterService],
})
export class EmailCenterModule {}
