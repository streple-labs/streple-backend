import { Module } from '@nestjs/common';
import { LearningHubService } from './learninghub.service';
import { LearningHubController } from './learninghub.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningHub } from './entities/learninghub.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LearningHub])],
  controllers: [LearningHubController],
  providers: [LearningHubService],
})
export class LearninghubModule {}
