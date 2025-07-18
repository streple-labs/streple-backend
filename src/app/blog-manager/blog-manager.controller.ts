import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlogManagerService } from './blog-manager.service';
import { CreateBlogManagerDto } from './dto/create-blog-manager.dto';
import { UpdateBlogManagerDto } from './dto/update-blog-manager.dto';

@Controller('blog-manager')
export class BlogManagerController {
  constructor(private readonly blogManagerService: BlogManagerService) {}

  @Post()
  create(@Body() createBlogManagerDto: CreateBlogManagerDto) {
    return this.blogManagerService.create(createBlogManagerDto);
  }

  @Get()
  findAll() {
    return this.blogManagerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogManagerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogManagerDto: UpdateBlogManagerDto) {
    return this.blogManagerService.update(+id, updateBlogManagerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogManagerService.remove(+id);
  }
}
