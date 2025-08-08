// src/copy-trading/copy-trading.controller.ts
import { AuthUser } from '@app/common';
import { SessionUser } from '@app/decorators';
import { Role } from '@app/users/interface/user.interface';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../global/decorators/roles.decorator';
import { CopyTradingService } from './copy-trading.service';
import { ExecuteDto } from './dto/execute.dto';
import { SignalDto } from './dto/signal.dto';
import { SubscribeDto } from './dto/subscribe.dto';

@ApiTags('CopyTrading')
@ApiBearerAuth()
@Controller('copy')
export class CopyTradingController {
  constructor(private readonly svc: CopyTradingService) {}

  /* --- PRO: publish signal --------------------------------- */
  @Roles(Role.pro)
  @Post('signals')
  @ApiOperation({ summary: 'Pro trader publishes signal' })
  @ApiResponse({ status: 201, description: 'Signal published successfully' })
  publish(@SessionUser() user: AuthUser, @Body() dto: SignalDto) {
    return this.svc.publishSignal(user.id, dto);
  }

  /* --- FOLLOWER: subscribe & allocate ---------------------- */
  @Roles(Role.follower)
  @Post('subscribe')
  @ApiOperation({ summary: 'Follower allocates funds to pro' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  subscribe(@SessionUser() user: AuthUser, @Body() dto: SubscribeDto) {
    return this.svc.subscribe(user.id, dto);
  }

  /* --- FOLLOWER: execute a signal -------------------------- */
  @Roles(Role.follower)
  @Post('execute')
  @ApiOperation({ summary: 'Follower executes a signal' })
  @ApiResponse({ status: 201, description: 'Trade executed successfully' })
  execute(@SessionUser() user: AuthUser, @Body() dto: ExecuteDto) {
    return this.svc.executeSignal(user.id, dto.signalId);
  }

  /* --- FOLLOWER: view wallets & trades --------------------- */
  @Get('wallets')
  @ApiOperation({ summary: 'Follower copy wallets' })
  @ApiResponse({ status: 200, description: 'Returns copy wallet per trader' })
  wallets(@SessionUser() user: AuthUser) {
    return this.svc.getFollowerWallets(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Follower trade history' })
  @ApiResponse({
    status: 200,
    description: 'Returns trade history with details',
  })
  history(@SessionUser() user: AuthUser) {
    return this.svc.getFollowerTrades(user.id);
  }

  /* --- ADMIN or CRON: close trade (simplified) ------------- */
  @Patch('close/:tradeId')
  @ApiOperation({ summary: 'Close a trade (admin/cron/demo)' })
  @ApiResponse({ status: 200, description: 'Trade closed successfully' })
  close(@Param('tradeId') tradeId: string) {
    return this.svc.closeTrade(tradeId, 0); // exitPrice unused in demo
  }
}
