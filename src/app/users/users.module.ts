import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CopyWallet } from '../copy-trading/entities/copy-wallet.entity';
import { JwtStrategy } from 'src/app/auth/jwt.strategy';
import { MailerService } from 'src/app/auth/mailer.service';
import { AdminsService } from 'src/app/admins/admins.service';
import { Admin } from 'src/app/admins/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, CopyWallet, Admin])],
  providers: [UsersService, AdminsService, JwtStrategy, MailerService],
  controllers: [UsersController],
  exports: [UsersService, JwtStrategy],
})
export class UsersModule {}
