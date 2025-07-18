import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { EmailCenterService } from './email-center.service';
import {
  FindManyEmail,
  FindOneEmail,
  UpdateEmailCenterDto,
} from './dto/email-center.dto';
import { CreateEmailCenter } from './dto';
import { ParamSearch } from 'src/global/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@Controller()
@ApiTags('Email Center')
export class EmailCenterController {
  constructor(private readonly emailCenterService: EmailCenterService) {}

  @Post('email')
  @ApiOperation({ summary: 'Create new Email' })
  @ApiBody({ type: CreateEmailCenter })
  create(@Body() createEmailCenterDto: CreateEmailCenter) {
    const { schedule, scheduleDate } = createEmailCenterDto;

    if ((schedule && scheduleDate === null) || scheduleDate === undefined) {
      throw new ForbiddenException('schedule date not valid');
    }
    return this.emailCenterService.create(createEmailCenterDto);
  }

  @Get('emails')
  @ApiOperation({ summary: 'Find many emails filter with available field' })
  @ApiQuery({ type: FindManyEmail })
  findAll(@Query() query: FindManyEmail) {
    return this.emailCenterService.findAll(query);
  }

  @Get('email')
  @ApiOperation({ summary: 'Find one email, filter with available field' })
  @ApiQuery({ type: FindOneEmail })
  findOne(@Query() query: FindOneEmail) {
    return this.emailCenterService.findOne(query);
  }

  @Patch('email/:id')
  @ApiBody({ type: UpdateEmailCenterDto })
  @ApiOperation({ summary: 'Edit email data' })
  @ApiParam({ type: ParamSearch, required: true, name: 'id' })
  update(
    @Param() param: ParamSearch,
    @Body() updateEmailCenterDto: UpdateEmailCenterDto,
  ) {
    return this.emailCenterService.update(param, updateEmailCenterDto);
  }

  @ApiParam({ type: ParamSearch, required: true, name: 'id' })
  @ApiOperation({ summary: 'Delete one email' })
  @Delete('email/:id')
  remove(@Param() param: ParamSearch) {
    return this.emailCenterService.remove(param);
  }
}
