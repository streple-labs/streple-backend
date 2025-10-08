import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { JwtStrategy } from 'src/global/strategies/jwt.strategy';
import { Privileges, Protrader, RoleModel } from './entity';
import { ProTraderService, RoleService, UsersService } from './service';
import {
  ProtraderController,
  RoleController,
  UsersController,
} from './controller';
import { TwoFaController } from './controller/tfa.controller';
import { TwoFAService } from './service/twofa.service';
import { SecurityService } from '@app/helpers';

@Module({
  imports: [TypeOrmModule.forFeature([User, RoleModel, Privileges, Protrader])],
  providers: [
    UsersService,
    RoleService,
    JwtStrategy,
    TwoFAService,
    SecurityService,
    ProTraderService,
  ],
  controllers: [
    UsersController,
    RoleController,
    TwoFaController,
    ProtraderController,
  ],
  exports: [
    UsersService,
    JwtStrategy,
    RoleService,
    TwoFAService,
    ProTraderService,
  ],
})
export class UsersModule {}
