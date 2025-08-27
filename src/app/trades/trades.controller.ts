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
  CopyTrade,
  CreateTrade,
  FindManyTrade,
  FindOneTrade,
  UpdateTrade,
} from './input';
import { TradesService } from './trades.service';

@Controller({
  version: VERSION_NEUTRAL,
})
@ApiTags('TRADES')
@ApiBearerAuth()
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post('trade')
  @ApiOperation({ summary: 'Create new trade' })
  @ApiBody({ type: CreateTrade })
  create(@Body() createTrade: CreateTrade, @SessionUser() user: AuthUser) {
    return this.tradesService.create(createTrade, user);
  }

  @Get('trades')
  @ApiOperation({ summary: 'Get all the trades' })
  findAll(@Query() query: FindManyTrade) {
    return this.tradesService.findAll(query);
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
  @ApiOperation({ summary: 'Get treading stats' })
  tradingStats(@SessionUser() user: AuthUser) {
    return this.tradesService.getTradingStats(user.id);
  }

  @Get('token-names')
  @ApiOperation({ summary: 'Get token names and symbols' })
  getTokenNames() {
    return this.tradesService.getTokenNames();
  }

  @Get('cancel-trade/:id')
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

  @Patch('trade/:id')
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

  @Delete('trade/:id')
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
}
