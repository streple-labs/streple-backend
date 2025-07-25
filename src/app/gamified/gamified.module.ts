import { Module } from '@nestjs/common';
import { GamifiedService } from './gamified.service';
import { GamifiedController } from './gamified.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameProgress, GamingOnboarding } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([GamingOnboarding, GameProgress])],
  controllers: [GamifiedController],
  providers: [GamifiedService],
  exports: [GamifiedService],
})
export class GamifiedModule {}
