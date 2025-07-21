import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ParamSearch } from 'src/global/common';
import { BlogManagerService } from './blog-manager.service';
import { CreateBlog, FindManyBlog, FindOneBlog, UpdateBlog } from './dto';

@Controller('blog-manager')
export class BlogManagerController {
  constructor(private readonly blogManagerService: BlogManagerService) {}

  @Post()
  @ApiBody({ type: CreateBlog })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(
    @UploadedFile()
    file: Express.Multer.File,
    @Body() create: CreateBlog,
  ) {
    if (file) {
      this.validateDocuments(file);
    }
    return this.blogManagerService.create(create, file);
  }

  @Get()
  @ApiOperation({ summary: 'Find many' })
  @ApiQuery({ type: FindManyBlog })
  findAll(@Query() query: FindManyBlog) {
    return this.blogManagerService.findAll(query);
  }

  @Get()
  @ApiOperation({ summary: 'Find one' })
  @ApiQuery({ type: FindOneBlog })
  findOne(@Query() param: FindOneBlog) {
    return this.blogManagerService.findOne(param);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateBlog })
  @ApiParam({ name: 'id', required: true, type: ParamSearch })
  @ApiOperation({ summary: 'update blog' })
  update(@Param() param: ParamSearch, @Body() update: UpdateBlog) {
    return this.blogManagerService.update(param, update);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', required: true, type: ParamSearch })
  @ApiOperation({ summary: 'Delete One Blog' })
  remove(@Param() param: ParamSearch) {
    return this.blogManagerService.remove(param);
  }

  private validateDocuments(document: Express.Multer.File): void {
    if (!document) return;

    if (!document.buffer || document.size === 0) {
      throw new ForbiddenException(`Document is empty`);
    }

    const validMimeTypes = ['image/jpeg', 'image/png'];

    if (!validMimeTypes.includes(document.mimetype)) {
      throw new ForbiddenException(
        `Document has invalid file type. Only JPEG, PNG, DOCX, DOC, or PDF are allowed`,
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (document.size > maxSize) {
      throw new ForbiddenException(`Document exceeds maximum size of 5MB`);
    }
  }
}
