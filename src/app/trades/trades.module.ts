import { User } from '@app/users/entity';
import { UsersModule } from '@app/users/users.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BinanceGateway } from './binance.gateway';
import { FollowTraders, TradeActivityFeeds, Trades } from './entities';
import { PriceCache } from './price-caches';
import { ActivityService, TradeJobWorker, TradesService } from './services';
import { TradesController } from './trades.controller';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Trades, TradeActivityFeeds, FollowTraders, User]),
  ],
  controllers: [TradesController],
  providers: [
    TradesService,
    BinanceGateway,
    PriceCache,
    ActivityService,
    TradeJobWorker,
  ],
  exports: [TradesService, TradeJobWorker],
})
export class TradesModule {}
