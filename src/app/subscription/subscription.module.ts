import { BalanceSharedModule } from '@app/balance/module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription, SubscriptionHistory } from './entities';
import { SubscriptionJobService, SubscriptionService } from './service';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionHistory]),
    BalanceSharedModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionJobService],
  exports: [SubscriptionService, SubscriptionJobService],
})
export class SubscriptionModule {}
