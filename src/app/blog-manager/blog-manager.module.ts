import { forwardRef, Module } from '@nestjs/common';
import { BlogManagerService } from './blog-manager.service';
import { BlogManagerController } from './blog-manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogManager } from './entities/blog-manager.entity';
import { GlobalModule } from 'src/global/global.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogManager]),
    forwardRef(() => GlobalModule),
  ],
  controllers: [BlogManagerController],
  providers: [BlogManagerService],
  exports: [BlogManagerService],
})
export class BlogManagerModule {}
