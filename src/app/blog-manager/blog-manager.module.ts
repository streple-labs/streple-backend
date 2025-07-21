import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalModule } from 'src/global/global.module';
import { BlogManagerController } from './blog-manager.controller';
import { BlogManagerService } from './blog-manager.service';
import { BlogManager } from './entities/blog-manager.entity';

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
