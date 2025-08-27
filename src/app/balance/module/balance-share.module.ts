import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Balance, Transactions } from '../entities';
import { BalanceService } from '../balance.service';

@Module({
  imports: [TypeOrmModule.forFeature([Balance, Transactions])],
  providers: [BalanceService],
  exports: [BalanceService, TypeOrmModule],
})
export class BalanceSharedModule {}
