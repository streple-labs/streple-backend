import { User } from '@app/users/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Beneficiary,
  CryptoAccounts,
  FiatAccount,
  Transaction,
  Wallets,
  WalletSet,
} from './entities';
import { WalletsController } from './wallets.controller';
import { USDCService, WalletsService } from './service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FiatAccount,
      User,
      Wallets,
      Transaction,
      Beneficiary,
      WalletSet,
      CryptoAccounts,
    ]),
  ],
  controllers: [WalletsController],
  providers: [WalletsService, USDCService],
  exports: [WalletsService, USDCService],
})
export class WalletsModule {}
