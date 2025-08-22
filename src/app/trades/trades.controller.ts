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
  CopyTrade,
  CreateTrade,
  FindManyTrade,
  FindOneTrade,
  Parameter,
  UpdateTrade,
} from './input';
import { TradesService } from './trades.service';

@Controller({
  version: VERSION_NEUTRAL,
})
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post('trade')
  create(@Body() createTrade: CreateTrade, @SessionUser() user: AuthUser) {
    return this.tradesService.create(createTrade, user);
  }

  @Get('trades')
  findAll(@Query() query: FindManyTrade) {
    return this.tradesService.findAll(query);
  }

  @Get('trade')
  findOne(@Query() query: FindOneTrade) {
    return this.tradesService.findOne(query);
  }

  @Post('copy-trade')
  copyTrade(@Body() body: CopyTrade, @SessionUser() user: AuthUser) {
    return this.tradesService.copyTrade(body, user);
  }

  @Get('cancel-trade/:id')
  cancelTrade(@Param() param: Parameter, @SessionUser() user: AuthUser) {
    return this.tradesService.cancelTrade(param.id, user);
  }

  @Patch('trade/:id')
  update(
    @Param() param: Parameter,
    @Body() updateTrade: UpdateTrade,
    @SessionUser() user: AuthUser,
  ) {
    return this.tradesService.update(param.id, updateTrade, user);
  }

  @Delete('trade/:id')
  remove(@Param() param: Parameter, @SessionUser() user: AuthUser) {
    return this.tradesService.remove(param.id, user);
  }
}
