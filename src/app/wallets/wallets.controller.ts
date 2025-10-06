import { AuthUser } from '@app/common';
import { SessionUser } from '@app/decorators';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Convert,
  FindManyTransaction,
  FindOneTransaction,
  transactionType,
} from './input';
import { WalletsService } from './wallets.service';

@Controller({
  version: VERSION_NEUTRAL,
})
@ApiBearerAuth()
@ApiTags('Wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('virtual-account')
  @ApiOperation({ summary: 'Create Virtual Naira Account' })
  async createAccount(@SessionUser() user: AuthUser) {
    return this.walletsService.createVirtualAccount(user);
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert Currency' })
  @ApiBody({ type: Convert })
  async convertCurrency(@Body() body: Convert) {
    return this.walletsService.convert(body);
  }

  @Get('user-balance')
  @ApiOperation({ summary: 'Get User Wallet Balance' })
  async balance(@SessionUser() user: AuthUser) {
    return this.walletsService.userBalance(user);
  }

  @Get('recent-transactions')
  @ApiOperation({ summary: 'Get User Recent Transactions' })
  async recentTransactions(@SessionUser() user: AuthUser) {
    return this.walletsService.findManyTransaction({
      userId: [user.id],
      type: transactionType.tra,
      include: ['recipient'],
      sort: ['createdAt'],
      limit: 5,
    });
  }

  @Get('transaction')
  @ApiOperation({ summary: 'Get Single Transaction' })
  async getTransaction(@Query() query: FindOneTransaction) {
    return this.walletsService.findOneTransaction(query);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get All Transactions' })
  async getTransactions(@Query() query: FindManyTransaction) {
    return this.walletsService.findManyTransaction(query);
  }
}
