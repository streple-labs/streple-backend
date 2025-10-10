import { AuthUser } from '@app/common';
import { Abilities, SessionUser } from '@app/decorators';
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
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ToggleRoleDto } from '../dto/toggle-role.dto';
import {
  ChangePin,
  CreateUser,
  CTP,
  FindManyUser,
  FindOneUser,
  UpdateProfile,
} from '../dto/top-up.dto';
import { Role } from '../interface';
import { UsersService } from '../service';

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

  @Post('create-admins')
  @Abilities('MANAGE_USER')
  @ApiBody({ type: CreateUser })
  @ApiOperation({ summary: 'create new admins' })
  CreateAdmin(@Body() body: CreateUser, @SessionUser() user: AuthUser) {
    if (user.role !== Role.superAdmin || user.roleLevel !== 4) {
      throw new UnauthorizedException('Insufficient accessibility');
    }
    return this.users.createAdmin(body);
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
  // @Abilities('MANAGE_USER')
  @ApiOperation({ summary: 'Find Many User' })
  async FindManyUser(@Query() query: FindManyUser) {
    return this.users.findMany(query);
  }

  @Get('get-user')
  // @Abilities('MANAGE_USER')
  @ApiOperation({ summary: 'Find One User' })
  async FindOneUser(@Query() query: FindOneUser) {
    return this.users.findOne(query);
  }

  @Post('transaction-pin')
  @ApiBody({ type: CTP })
  async createTransactionPin(@Body() body: CTP, @SessionUser() user: AuthUser) {
    return this.users.createTransactionPin(body, user);
  }

  @Post('change-transaction-pin')
  @ApiBody({ type: ChangePin })
  async ChangeTransactionPin(
    @Body() body: ChangePin,
    @SessionUser() user: AuthUser,
  ) {
    return this.users.changeTransactionPin(body, user);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
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
