import { GlobalModule } from '@app/global.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BinanceGateway } from './binance.gateway';
import { TradeActivityFeeds, Trades } from './entities';
import { PriceCache } from './price-caches';
import { ActivityService, TradesService } from './services';
import { TradesController } from './trades.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trades, TradeActivityFeeds]),
    forwardRef(() => GlobalModule),
  ],
  controllers: [TradesController],
  providers: [TradesService, BinanceGateway, PriceCache, ActivityService],
  exports: [TradesService],
})
export class TradesModule {}
