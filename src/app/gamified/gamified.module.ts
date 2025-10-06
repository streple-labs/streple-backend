import { WalletsModule } from '@app/wallets/wallets.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge, GameProgress, GamingOnboarding, UserBadge } from './entities';
import { GamifiedController } from './gamified.controller';
import { GamifiedService } from './gamified.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GamingOnboarding,
      GameProgress,
      UserBadge,
      Badge,
    ]),
    WalletsModule,
  ],
  controllers: [GamifiedController],
  providers: [GamifiedService],
  exports: [GamifiedService],
})
export class GamifiedModule {}
