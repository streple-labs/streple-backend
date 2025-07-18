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
import { LearningHubService } from './learninghub.service';
import {
  CreateLearning,
  FindManyLearning,
  FindOneLearning,
  UpdateLearning,
} from './dto';
import { ParamSearch } from 'src/global/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@Controller()
@ApiTags('Learning Hub')
export class LearningHubController {
  constructor(private readonly learningService: LearningHubService) {}

  @Post('learning')
  @ApiOperation({ summary: 'Create new learning resource' })
  @ApiBody({ type: CreateLearning })
  create(@Body() create: CreateLearning) {
    return this.learningService.create(create);
  }

  @Get('learnings')
  @ApiOperation({ summary: 'Find many learning resources' })
  @ApiQuery({ type: FindManyLearning })
  findAll(@Query() query: FindManyLearning) {
    return this.learningService.findAll(query);
  }

  @Get('learning')
  @ApiOperation({ summary: 'Find one learning resources' })
  @ApiQuery({ type: FindOneLearning })
  findOne(@Query() query: FindOneLearning) {
    return this.learningService.findOne(query);
  }

  @Patch('learning/:id')
  @ApiOperation({ summary: 'Edit learning resource' })
  @ApiBody({ type: UpdateLearning })
  @ApiParam({ type: ParamSearch, required: true, name: 'id' })
  update(@Param() param: ParamSearch, @Body() updateLearning: UpdateLearning) {
    return this.learningService.update(param, updateLearning);
  }

  @Delete('learning/:id')
  @ApiOperation({ summary: 'Delete learning resources' })
  @ApiParam({ type: ParamSearch, required: true, name: 'id' })
  remove(@Param() param: ParamSearch) {
    return this.learningService.remove(param);
  }
}
