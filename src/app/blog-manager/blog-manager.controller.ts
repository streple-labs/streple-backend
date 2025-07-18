import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BlogManagerService } from './blog-manager.service';
import { CreateBlog, FindManyBlog, FindOneBlog, UpdateBlog } from './dto';
import { ParamSearch } from 'src/global/common';

@Controller('blog-manager')
export class BlogManagerController {
  constructor(private readonly blogManagerService: BlogManagerService) {}

  @Post()
  create(@Body() create: CreateBlog) {
    return this.blogManagerService.create(create);
  }

  @Get()
  findAll(@Query() query: FindManyBlog) {
    return this.blogManagerService.findAll(query);
  }

  @Get()
  findOne(@Query() param: FindOneBlog) {
    return this.blogManagerService.findOne(param);
  }

  @Patch(':id')
  update(@Param() param: ParamSearch, @Body() update: UpdateBlog) {
    return this.blogManagerService.update(param, update);
  }

  @Delete(':id')
  remove(@Param() param: ParamSearch) {
    return this.blogManagerService.remove(param);
  }
}
