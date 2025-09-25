import { GlobalModule } from '@app/global.module';
import { UsersModule } from '@app/users/users.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BinanceGateway } from './binance.gateway';
import { FollowTraders, TradeActivityFeeds, Trades } from './entities';
import { PriceCache } from './price-caches';
import { ActivityService, TradesService } from './services';
import { TradesController } from './trades.controller';
import { User } from '@app/users/entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Trades, TradeActivityFeeds, FollowTraders, User]),
    forwardRef(() => GlobalModule),
  ],
  controllers: [TradesController],
  providers: [TradesService, BinanceGateway, PriceCache, ActivityService],
  exports: [TradesService],
})
export class TradesModule {}
