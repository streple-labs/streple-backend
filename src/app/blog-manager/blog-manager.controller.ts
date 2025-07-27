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
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, ParamSearch } from 'src/global/common';
import { BlogManagerService } from './blog-manager.service';
import { CreateBlog, FindManyBlog, FindOneBlog, UpdateBlog } from './dto';
import { Public, SessionUser } from '@app/decorators';

@Controller({
  version: VERSION_NEUTRAL,
})
@ApiTags('Blog Manager')
@ApiBearerAuth()
export class BlogManagerController {
  constructor(private readonly blogManagerService: BlogManagerService) {}

  @Post('blog')
  @ApiBody({ type: CreateBlog })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(
    @UploadedFile()
    file: Express.Multer.File,
    @Body() create: CreateBlog,
    @SessionUser() user: AuthUser,
  ) {
    if (file) {
      this.validateDocuments(file);
    }
    return this.blogManagerService.create(create, file, user);
  }

  @Public()
  @Get('blogs')
  @ApiOperation({ summary: 'Find many' })
  findAll(@Query() query: FindManyBlog) {
    return this.blogManagerService.findAll(query);
  }

  @Public()
  @Get('blog')
  @ApiOperation({ summary: 'Find one' })
  findOne(@Query() param: FindOneBlog) {
    return this.blogManagerService.findOne(param);
  }

  @Patch('blog/:id')
  @ApiBody({ type: UpdateBlog })
  @ApiParam({ name: 'id', required: true, type: ParamSearch })
  @ApiOperation({ summary: 'update blog' })
  update(
    @Param() param: ParamSearch,
    @Body() update: UpdateBlog,
    @SessionUser() user: AuthUser,
  ) {
    return this.blogManagerService.update(param, update, user);
  }

  @Delete('blog/:id')
  @ApiParam({ name: 'id', required: true, type: ParamSearch })
  @ApiOperation({ summary: 'Delete One Blog' })
  remove(@Param() param: ParamSearch, @SessionUser() user: AuthUser) {
    return this.blogManagerService.remove(param, user);
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
