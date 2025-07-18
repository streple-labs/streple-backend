import { Module } from '@nestjs/common';
import { BlogManagerService } from './blog-manager.service';
import { BlogManagerController } from './blog-manager.controller';

@Module({
  controllers: [BlogManagerController],
  providers: [BlogManagerService],
})
export class BlogManagerModule {}
