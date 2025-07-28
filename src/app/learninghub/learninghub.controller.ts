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
  UploadedFiles,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, ParamSearch } from 'src/global/common';
import {
  CreateLearning,
  FindManyLearning,
  FindOneLearning,
  UpdateLearning,
} from './dto';
import { LearningHubService } from './learninghub.service';
import { Public, SessionUser } from '@app/decorators';

@Controller({
  version: VERSION_NEUTRAL,
})
@ApiTags('Learning Hub')
@ApiBearerAuth()
export class LearningHubController {
  constructor(private readonly learningService: LearningHubService) {}

  @Post('learning')
  @ApiOperation({
    summary: 'Create new learning resource',
    description: 'Upload a learning resource with its document and thumbnail',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateLearning })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  async create(
    @Body() body: CreateLearning,
    @UploadedFiles()
    files: {
      document?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
    @SessionUser() user: AuthUser,
  ) {
    const document = files.document?.[0];
    const thumbnail = files.thumbnail?.[0];

    if (document) {
      this.validateDocuments(document);
    }

    if (thumbnail) {
      this.validateDocuments(thumbnail);
    }

    return this.learningService.create(body, document, thumbnail, user);
  }

  @Get('learnings')
  @Public()
  @ApiOperation({ summary: 'Find many learning resources' })
  findAll(@Query() query: FindManyLearning) {
    return this.learningService.findAll(query);
  }

  @Get('learning')
  @Public()
  @ApiOperation({ summary: 'Find one learning resources' })
  findOne(@Query() query: FindOneLearning) {
    return this.learningService.findOne(query);
  }

  @Patch('learning/:id')
  @ApiOperation({ summary: 'Edit learning resource' })
  @ApiBody({ type: UpdateLearning })
  @ApiParam({ type: ParamSearch, required: true, name: 'id' })
  update(
    @Param() param: ParamSearch,
    @Body() updateLearning: UpdateLearning,
    @SessionUser() user: AuthUser,
  ) {
    return this.learningService.update(param, updateLearning, user);
  }

  @Delete('learning/:id')
  @ApiOperation({ summary: 'Delete learning resources' })
  @ApiParam({ type: ParamSearch, required: true, name: 'id' })
  remove(@Param() param: ParamSearch, @SessionUser() user: AuthUser) {
    return this.learningService.remove(param, user);
  }

  private validateDocuments(document: Express.Multer.File): void {
    if (!document) return;

    if (!document.buffer || document.size === 0) {
      throw new ForbiddenException(`Document is empty`);
    }

    const validMimeTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword', // .doc (Older Word)
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx (Modern Word)
    ];

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
