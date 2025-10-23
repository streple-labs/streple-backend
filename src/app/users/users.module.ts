import { SecurityService } from '@app/helpers';
import { WalletsModule } from '@app/wallets/wallets.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from 'src/global/strategies/jwt.strategy';
import {
  ProtraderController,
  RoleController,
  UsersController,
} from './controller';
import { TwoFaController } from './controller/tfa.controller';
import { Privileges, Protrader, RoleModel } from './entity';
import { User } from './entity/user.entity';
import { ProTraderService, RoleService, UsersService } from './service';
import { TwoFAService } from './service/twofa.service';
import { UserScheduleService } from './service/user-schdule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RoleModel, Privileges, Protrader]),
    WalletsModule,
  ],
  providers: [
    UsersService,
    RoleService,
    JwtStrategy,
    TwoFAService,
    SecurityService,
    ProTraderService,
    UserScheduleService,
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
