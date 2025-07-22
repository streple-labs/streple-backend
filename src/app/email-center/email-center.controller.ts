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
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ParamSearch } from 'src/global/common';
import { CreateEmailCenter } from './dto';
import {
  FindManyEmail,
  FindOneEmail,
  UpdateEmailCenterDto,
} from './dto/email-center.dto';
import { EmailCenterService } from './email-center.service';

@Controller({
  version: VERSION_NEUTRAL,
})
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
  findAll(@Query() query: FindManyEmail) {
    return this.emailCenterService.findAll(query);
  }

  @Get('email')
  @ApiOperation({ summary: 'Find one email, filter with available field' })
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
