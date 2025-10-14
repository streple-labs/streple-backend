import { Abilities } from '@app/decorators';
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ParamSearch } from 'src/global/common';
import { CreateEmailCenter } from './dto';
import {
  FindManyEmail,
  FindOneEmail,
  UpdateEmailCenterDto,
} from './dto/email-center.dto';
import { EmailCenterService } from './services';

@Controller({ version: VERSION_NEUTRAL })
@ApiTags('Email Center')
@ApiBearerAuth()
export class EmailCenterController {
  constructor(private readonly emailCenterService: EmailCenterService) {}

  @Post('email')
  @Abilities('EMAIL_SEND')
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
  @Abilities('EMAIL_READ')
  @ApiOperation({ summary: 'Find many emails filter with available field' })
  findAll(@Query() query: FindManyEmail) {
    return this.emailCenterService.findAll(query);
  }

  @Get('email')
  @Abilities('EMAIL_READ')
  @ApiOperation({ summary: 'Find one email, filter with available field' })
  findOne(@Query() query: FindOneEmail) {
    return this.emailCenterService.findOne(query);
  }

  @Patch('email/:id')
  @Abilities('EMAIL_UPDATE')
  @ApiBody({ type: UpdateEmailCenterDto })
  @ApiOperation({ summary: 'Edit email data' })
  @ApiParam({ type: ParamSearch, required: true, name: 'id' })
  update(
    @Param() param: ParamSearch,
    @Body() updateEmailCenterDto: UpdateEmailCenterDto,
  ) {
    return this.emailCenterService.update(param, updateEmailCenterDto);
  }

  @Delete('email/:id')
  @Abilities('EMAIL_DELETE')
  @ApiParam({ type: ParamSearch, required: true, name: 'id' })
  @ApiOperation({ summary: 'Delete one email' })
  remove(@Param() param: ParamSearch) {
    return this.emailCenterService.remove(param);
  }
}
