import { Injectable } from '@nestjs/common';
import { CreateBlogManagerDto } from './dto/create-blog-manager.dto';
import { UpdateBlogManagerDto } from './dto/update-blog-manager.dto';

@Injectable()
export class BlogManagerService {
  create(createBlogManagerDto: CreateBlogManagerDto) {
    return 'This action adds a new blogManager';
  }

  findAll() {
    return `This action returns all blogManager`;
  }

  findOne(id: number) {
    return `This action returns a #${id} blogManager`;
  }

  update(id: number, updateBlogManagerDto: UpdateBlogManagerDto) {
    return `This action updates a #${id} blogManager`;
  }

  remove(id: number) {
    return `This action removes a #${id} blogManager`;
  }
}
