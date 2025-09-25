import { AuthUser, FindMany } from '@app/common';
import { Abilities, SessionUser } from '@app/decorators';
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
  CopyTrade,
  CreateFollower,
  CreateTrade,
  Curve,
  FilterWithUserId,
  FindManyActivity,
  FindManyTrade,
  FindOneTrade,
  ProfilePerformance,
  UpdateTrade,
} from './input';
import { ActivityService, TradesService } from './services';

@Controller({
  version: VERSION_NEUTRAL,
})
@ApiTags('TRADES')
@ApiBearerAuth()
export class TradesController {
  constructor(
    private readonly tradesService: TradesService,
    private readonly activity: ActivityService,
  ) {}

  @Post('trade')
  @Abilities('TRADE_CREATE')
  @ApiOperation({ summary: 'Create new trade' })
  @ApiBody({ type: CreateTrade })
  create(@Body() createTrade: CreateTrade, @SessionUser() user: AuthUser) {
    return this.tradesService.create(createTrade, user);
  }

  @Get('trades')
  @Abilities('TRADE_MANAGE')
  @ApiOperation({ summary: 'Get all the trades' })
  findAll(@Query() query: FindManyTrade) {
    return this.tradesService.findAll(query);
  }

  @Get('user-trades')
  @ApiOperation({ summary: 'Get all the trades' })
  findAllTradePostedByCurrentUser(
    @Query() query: FindManyTrade,
    @SessionUser() user: AuthUser,
  ) {
    return this.tradesService.findAll({ ...query, userId: [user.id] });
  }

  @Get('trade')
  @ApiOperation({ summary: 'Get single trade' })
  findOne(@Query() query: FindOneTrade) {
    return this.tradesService.findOne(query);
  }

  @Post('copy-trade')
  @ApiOperation({ summary: 'Copy trades' })
  @ApiBody({ type: CopyTrade })
  copyTrade(@Body() body: CopyTrade, @SessionUser() user: AuthUser) {
    return this.tradesService.copyTrade(body, user);
  }

  @Get('trading-stats')
  @Abilities('TRADE_MANAGE')
  @ApiOperation({ summary: 'Get treading stats' })
  tradingStats(@SessionUser() user: AuthUser) {
    return this.tradesService.getTradingStats(user.id);
  }

  @Get('token-names')
  @ApiOperation({ summary: 'Get token names and symbols' })
  getTokenNames() {
    return this.tradesService.getTokenNames();
  }

  @Get('cancel-trade/:tradeId')
  @ApiOperation({ summary: 'Cancel on going trade' })
  @ApiParam({
    type: String,
    format: 'uuid',
    name: 'tradeId',
    required: true,
  })
  cancelTrade(
    @Param('tradeId') tradeId: string,
    @SessionUser() user: AuthUser,
  ) {
    return this.tradesService.cancelTrade(tradeId, user);
  }

  @Patch('trade/:tradeId')
  @Abilities('TRADE_UPDATE')
  @ApiOperation({ summary: 'Update un-start trade' })
  @ApiParam({
    type: String,
    format: 'uuid',
    name: 'tradeId',
    required: true,
  })
  @ApiBody({ type: UpdateTrade })
  update(
    @Param('tradeId') tradeId: string,
    @Body() updateTrade: UpdateTrade,
    @SessionUser() user: AuthUser,
  ) {
    return this.tradesService.update(tradeId, updateTrade, user);
  }

  @Delete('trade/:tradeId')
  @Abilities('TRADE_DELETE')
  @ApiOperation({ summary: 'Delete Trade' })
  @ApiParam({
    type: String,
    format: 'uuid',
    name: 'tradeId',
    required: true,
  })
  remove(@Param('tradeId') tradeId: string, @SessionUser() user: AuthUser) {
    return this.tradesService.remove(tradeId, user);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Find users Activities' })
  ActivityFeeds(@Query() query: FindManyActivity) {
    return this.activity.findMany(query);
  }

  @Post('follow-trader')
  @ApiOperation({ summary: 'Follow a trader' })
  @ApiBody({ type: CreateFollower })
  followTrader(@Body() body: CreateFollower, @SessionUser() user: AuthUser) {
    return this.activity.followTrader(body, user);
  }

  @Get('traders')
  @ApiOperation({ summary: 'Find all traders' })
  findAllTraders(@Query() query: FindMany) {
    return this.activity.allTraders(query);
  }

  @Get('trade-profile-stats/:traderId')
  @ApiOperation({ summary: 'Get trader profile stats' })
  @ApiParam({ required: true, name: 'traderId', type: String, format: 'uuid' })
  getTraderStats(@Param() param: FilterWithUserId) {
    return this.activity.tradeProfileStats(param.traderId);
  }

  @Get('trade-profile-performance')
  @ApiOperation({ summary: 'Get trader performances' })
  profilePerformance(@Query() query: ProfilePerformance) {
    return this.activity.profitPerformance(query.period, query.userId);
  }

  @Get('drawdown-curve')
  @ApiOperation({ summary: 'Get the drawdown curve' })
  drawdownCurve(@Query() query: Curve) {
    return this.activity.drawdownCurve(query.period, query.userId);
  }

  @Get('performance-curve')
  @ApiOperation({ summary: 'Get the performance curve' })
  performanceCurve(@Query() query: Curve) {
    return this.activity.performanceCurve(query.period, query.userId);
  }
}
