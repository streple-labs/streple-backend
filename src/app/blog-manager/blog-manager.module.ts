import { UploadService } from '@app/services';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogManagerController } from './blog-manager.controller';
import { BlogManager } from './entities/blog-manager.entity';
import { BlogManagerService, BlogScheduleService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([BlogManager])],
  controllers: [BlogManagerController],
  providers: [BlogManagerService, BlogScheduleService, UploadService],
  exports: [BlogManagerService],
})
export class BlogManagerModule {}
