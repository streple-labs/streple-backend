import { Privileges, RoleModel, User } from '@app/users/entity';
import { UsersModule } from '@app/users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seed.service';
import { WaitList } from '@app/email-center/entities';
import { Badge } from '@app/gamified/entities';
import { CryptoAccounts } from '@app/wallets/entities';
import { WalletsModule } from '@app/wallets/wallets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleModel,
      Privileges,
      WaitList,
      Badge,
      User,
      CryptoAccounts,
    ]),
    UsersModule,
    WalletsModule,
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
