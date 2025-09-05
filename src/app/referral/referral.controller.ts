import { AuthUser } from '@app/common';
import { SessionUser } from '@app/decorators';
import {
  Body,
  Controller,
  Delete,
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
import {
  CreateReward,
  FindManyReferral,
  FindManyReward,
  FindOneReferral,
  ReferralStatus,
  TopReferral,
  UpdateReward,
} from './input';
import { ReferralService } from './referral.service';

@Controller({
  version: VERSION_NEUTRAL,
})
@ApiTags('REFERRER')
@ApiBearerAuth()
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('referrer-reward')
  @ApiOperation({ summary: 'Create new referrer reward' })
  @ApiBody({ type: CreateReward })
  create(@Body() body: CreateReward) {
    return this.referralService.createReward(body);
  }

  @Get('referrers')
  @ApiOperation({ summary: 'Find all referrers' })
  findAll(@Query() query: FindManyReferral) {
    return this.referralService.findAll(query);
  }

  @Get('referrer-rewards')
  @ApiOperation({ summary: 'Find many Referrer Rewards' })
  ReferrerReward(@Query() query: FindManyReward) {
    return this.referralService.findAlReward(query);
  }

  @Get('user-referrers')
  @ApiOperation({ summary: 'Find all logged in user referrers' })
  findAllUserReferrer(
    @Query() query: FindManyReferral,
    @SessionUser() user: AuthUser,
  ) {
    return this.referralService.findAll({
      ...query,
      indirectReferrerId: [user.id],
      directReferrerId: [user.id],
      status: ReferralStatus.ACTIVE,
    });
  }

  @Get('referrer-stats')
  @ApiOperation({ summary: 'get referrals stats' })
  referralStats(@SessionUser() user: AuthUser) {
    return this.referralService.referrerStats(user);
  }

  @Get('top-referrers')
  @ApiOperation({ summary: 'Get the top referral leader board' })
  topReferrer(@Query() query: TopReferral) {
    return this.referralService.getTopReferrers(query.limit);
  }

  @Get('referrer')
  @ApiOperation({ summary: 'Find one referrers' })
  findOne(@Query() query: FindOneReferral) {
    return this.referralService.findOne(query);
  }

  @Patch('referrer-reward/:id')
  @ApiParam({ type: String, required: true, name: 'id' })
  @ApiBody({ type: UpdateReward })
  @ApiOperation({ summary: 'Update referral reward' })
  update(@Param('id') filter: string, @Body() body: UpdateReward) {
    return this.referralService.update(filter, body);
  }

  @Delete('referrer-reward/:id')
  @ApiOperation({ summary: ' Delete referrer reward' })
  remove(@Param('id') filter: string) {
    return this.referralService.remove(filter);
  }
}
