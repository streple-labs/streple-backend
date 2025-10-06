import { Module } from '@nestjs/common';
import { BalanceService } from '../balance.service';
// import { BalanceController } from '../balance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Balance, Transactions } from '../entities';
import { BalanceSharedModule } from './balance-share.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Balance, Transactions]),
    BalanceSharedModule,
  ],
  // controllers: [BalanceController],
  providers: [BalanceService],
  exports: [BalanceService, TypeOrmModule],
})
export class BalanceModule {}
