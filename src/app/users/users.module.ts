import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CopyWallet } from '../copy-trading/entities/copy-wallet.entity';
import { JwtStrategy } from 'src/global/strategies/jwt.strategy';
import { MailerService } from 'src/app/auth/mailer.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, CopyWallet])],
  providers: [UsersService, JwtStrategy, MailerService],
  controllers: [UsersController],
  exports: [UsersService, JwtStrategy],
})
export class UsersModule {}
