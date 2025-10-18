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
  FindManyBeneficiary,
  FindManyTransaction,
  FindOneBeneficiary,
  FindOneTransaction,
  InternalTransfer,
  transactionType,
  TransferCoin,
} from './input';
import { USDCService, WalletsService } from './service';

@Controller({ version: VERSION_NEUTRAL })
@ApiBearerAuth()
@ApiTags('Wallets')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly usdcService: USDCService,
  ) {}

  @Get('virtual-account')
  @ApiOperation({ summary: 'Create Virtual Naira Account' })
  async createAccount(@SessionUser() user: AuthUser) {
    return this.walletsService.createVirtualAccount(user);
  }

  @Post('internal-transfer')
  @ApiOperation({ summary: 'Internal Transfer' })
  @ApiBody({ type: InternalTransfer })
  async internalTransfer(
    @Body() body: InternalTransfer,
    @SessionUser() user: AuthUser,
  ) {
    return this.walletsService.internalTransfer(body, user);
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
    const response = await this.walletsService.findManyTransaction({
      userId: [user.id],
      type: transactionType.tra,
      include: ['recipient'],
      sort: ['createdAt'],
      limit: 50,
    });

    // Filter to get only the latest transaction per recipient
    const seen = new Set();
    const uniqueRecipients = [];
    for (const tx of response.data) {
      const recipientId = tx.recipient?.id;
      if (recipientId && !seen.has(recipientId)) {
        seen.add(recipientId);
        uniqueRecipients.push(tx);
        if (uniqueRecipients.length === 5) break;
      }
    }

    return uniqueRecipients;
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

  @Get('beneficiaries')
  @ApiOperation({ summary: 'Get user beneficiaries' })
  async beneficiaries(
    @Query() query: FindManyBeneficiary,
    @SessionUser() user: AuthUser,
  ) {
    return this.walletsService.findManyBeneficiary({
      ...query,
      userId: [user.id],
      include: [...(query.include ?? []), 'recipient'],
    });
  }

  @Get('beneficiary')
  @ApiOperation({ summary: 'Get single user beneficiary' })
  async beneficiary(
    @Query() query: FindOneBeneficiary,
    @SessionUser() user: AuthUser,
  ) {
    return this.walletsService.findOneBeneficiary({
      ...query,
      userId: user.id,
    });
  }

  @Get('generator')
  async generate() {
    return this.usdcService.createWalletSet();
  }

  @Get('create-wallet')
  async createWalletForUser(
    @Query('name') name: string,
    @SessionUser() user: AuthUser,
  ) {
    return this.usdcService.createWalletForUser(name, user);
  }

  @Get('user-token-balance')
  async UserTokenBalance(@SessionUser() user: AuthUser) {
    return this.usdcService.userWalletBalance(user);
  }

  @Post('transfer-coin')
  @ApiBody({ type: TransferCoin })
  async TransferCoin(
    @Body() body: TransferCoin,
    @SessionUser() user: AuthUser,
  ) {
    return this.usdcService.createCryptoTransaction(body, user);
  }
}
