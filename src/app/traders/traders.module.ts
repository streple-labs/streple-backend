import { Module } from '@nestjs/common';
import { TradersService } from './traders.service';
import { TradersController } from './traders.controller';

@Module({
  controllers: [TradersController],
  providers: [TradersService],
})
export class TradersModule {}
