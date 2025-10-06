// import { AuthUser } from '@app/common';
// import { SessionUser } from '@app/decorators';
// import {
//   Body,
//   Controller,
//   Get,
//   Param,
//   Post,
//   Query,
//   VERSION_NEUTRAL,
// } from '@nestjs/common';
// import {
//   ApiBearerAuth,
//   ApiBody,
//   ApiOperation,
//   ApiParam,
//   ApiTags,
// } from '@nestjs/swagger';
// import { BalanceService } from './balance.service';
// import {
//   FindManyTransaction,
//   FindOneTransaction,
//   Transfer,
//   UserBalance,
// } from './dto';

// @Controller({
//   version: VERSION_NEUTRAL,
// })
// @ApiBearerAuth()
// @ApiTags('TRANSACTION')
// export class BalanceController {
//   constructor(private readonly balanceService: BalanceService) {}

//   @Get('transactions')
//   @ApiOperation({ summary: 'Get user transactions history' })
//   findAll(@Query() query: FindManyTransaction) {
//     return this.balanceService.findAll(query);
//   }

//   @Get('transaction')
//   @ApiOperation({ summary: 'Get user transaction history' })
//   findOne(@Query() query: FindOneTransaction) {
//     return this.balanceService.findOne(query);
//   }

//   @Get('user-balance')
//   @ApiOperation({ summary: 'Get users balance' })
//   UserBalance(@Query() query: UserBalance, @SessionUser() user: AuthUser) {
//     return this.balanceService.userBalance(query, user);
//   }

//   @Post('transfer-fund')
//   @ApiOperation({ summary: 'Transfer between account' })
//   @ApiBody({ type: Transfer })
//   TransferFundBetweenAccount(
//     @Body() dto: Transfer,
//     @SessionUser() user: AuthUser,
//   ) {
//     return this.balanceService.transferBetweenAccount(dto, user);
//   }

//   @Get('stp-leader-board/:limit')
//   @ApiOperation({ summary: 'Get stp leader board' })
//   @ApiParam({ name: 'limit', type: Number, required: false })
//   STPLeaderBoard(@Param('limit') limit: number) {
//     return this.balanceService.stpLeaderBoard(limit);
//   }
// }
