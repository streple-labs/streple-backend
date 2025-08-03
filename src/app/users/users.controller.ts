import { AuthUser } from '@app/common';
import { SessionUser } from '@app/decorators';
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ToggleRoleDto } from './dto/toggle-role.dto';
import {
  FindManyUser,
  FindOneUser,
  TopUpDto,
  UpdateProfile,
} from './dto/top-up.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /* -------- basic identity -------------------------------- */
  @Get('me')
  @ApiOperation({ summary: 'Current user basic JWT payload' })
  @ApiResponse({ status: 200, description: 'Decoded JWT payload' })
  me(@SessionUser() user: AuthUser) {
    return user;
  }

  /* -------- profile page ---------------------------------- */
  @Get('profile')
  @ApiOperation({ summary: 'Full profile' })
  @ApiResponse({ status: 200, description: 'Returns detailed user profile' })
  profile(@SessionUser() user: AuthUser) {
    return this.users.getProfile(user.id);
  }

  /* -------- role switching -------------------------------- */
  @Patch('toggle-role')
  @ApiOperation({ summary: 'Switch between PRO_TRADER / FOLLOWER' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  toggle(@SessionUser() user: AuthUser, @Body() dto: ToggleRoleDto) {
    return this.users.toggleRole(user.id, dto);
  }

  /* -------- dashboard (overview) -------------------------- */
  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard overview' })
  @ApiResponse({
    status: 200,
    description: 'Returns user trading dashboard info',
  })
  dashboard(@SessionUser() user: AuthUser) {
    return this.users.getDashboard(user.id);
  }

  @Get('get-users')
  @ApiOperation({ summary: 'Find Many User' })
  async FindManyUser(@Query() query: FindManyUser) {
    return this.users.findMany(query);
  }

  @Get('get-user')
  @ApiOperation({ summary: 'Find One User' })
  async FindOneUser(@Query() query: FindOneUser) {
    return this.users.findOne(query);
  }

  /* -------- funding account balance ----------------------- */
  @Get('demo-balance')
  @ApiOperation({ summary: 'Funding account balance' })
  @ApiResponse({ status: 200, description: 'Returns user funding balance' })
  async demoFunding(@SessionUser() user: AuthUser) {
    return this.users.getDemoFunding(user.id);
  }

  /* -------- top‑up funding balance (DEV / DEMO) ----------- */
  @Patch('demo-balance/top-up')
  @ApiOperation({ summary: 'Top-up funding balance (DEMO)' })
  @ApiResponse({ status: 200, description: 'Balance updated successfully' })
  async topUp(@SessionUser() user: AuthUser, @Body() dto: TopUpDto) {
    const response = await this.users.topUpDemoFunding(user.id, dto);
    return { ok: true, balance: response.demoFundingBalance };
  }

  /* -------- list copy wallets (per‑pro trading balances) -- */
  @Get('wallets')
  @ApiOperation({ summary: 'Per-pro copy wallets' })
  @ApiResponse({
    status: 200,
    description: 'Returns wallet balances grouped by trader',
  })
  wallets(@SessionUser() user: AuthUser) {
    return this.users.getCopyWallets(user.id);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(
    @SessionUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    if (!user) throw new UnauthorizedException();
    return this.users.changePassword(dto);
  }

  @Post('update-profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfile })
  async updateProfile(
    @Body() data: UpdateProfile,
    @SessionUser() user: AuthUser,
  ) {
    return this.users.updateProfile(data, user);
  }
}
