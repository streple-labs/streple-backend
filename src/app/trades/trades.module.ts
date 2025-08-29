import { forwardRef, Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trades } from './entities/trader.entity';
import { GlobalModule } from '@app/global.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trades]), forwardRef(() => GlobalModule)],
  controllers: [TradesController],
  providers: [TradesService],
  exports: [TradesService],
})
export class TradesModule {}
