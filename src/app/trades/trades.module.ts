import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trades } from './entities/trader.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trades])],
  controllers: [TradesController],
  providers: [TradesService],
})
export class TradesModule {}
