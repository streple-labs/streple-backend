import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { JwtStrategy } from 'src/global/strategies/jwt.strategy';
import { Privileges, RoleModel } from './entity';
import { RoleService, UsersService } from './service';
import { RoleController, UsersController } from './controller';
import { TwoFaController } from './controller/tfa.controller';
import { TwoFAService } from './service/twofa.service';
import { SecurityService } from '@app/helpers';

@Module({
  imports: [TypeOrmModule.forFeature([User, RoleModel, Privileges])],
  providers: [
    UsersService,
    RoleService,
    JwtStrategy,
    TwoFAService,
    SecurityService,
  ],
  controllers: [UsersController, RoleController, TwoFaController],
  exports: [UsersService, JwtStrategy, RoleService, TwoFAService],
})
export class UsersModule {}
