import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ProTraderService } from '../service';
import { Abilities, Public } from '@app/decorators';
import { CreateProtrader, FindManyProTrader, FindOneProTrader } from '../dto';

@Controller({ version: VERSION_NEUTRAL })
@ApiTags('Pro Traders')
@ApiBearerAuth()
export class ProtraderController {
  constructor(private readonly protraderService: ProTraderService) {}

  @Public()
  @Post('protrader')
  @ApiBody({ description: 'Create Pro Trader', type: CreateProtrader })
  createProtrader(@Body() dto: CreateProtrader) {
    return this.protraderService.createProTrader(dto);
  }

  @Get('protraders')
  @Abilities('MANAGE_PRO_TRADER_USER')
  findManyProtrader(@Query() query: FindManyProTrader) {
    return this.protraderService.findManyProTrader(query);
  }

  @Get('protrader')
  @Abilities('MANAGE_PRO_TRADER_USER')
  findOneProtrader(@Query() query: FindOneProTrader) {
    return this.protraderService.findOneProtrader(query);
  }
}
