import { Module } from '@nestjs/common';
import { BlogManagerService } from './blog-manager.service';
import { BlogManagerController } from './blog-manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogManager } from './entities/blog-manager.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlogManager])],
  controllers: [BlogManagerController],
  providers: [BlogManagerService],
})
export class BlogManagerModule {}
