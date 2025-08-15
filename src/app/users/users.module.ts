import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { CopyWallet } from '../copy-trading/entities/copy-wallet.entity';
import { JwtStrategy } from 'src/global/strategies/jwt.strategy';
import { Privileges, RoleModel } from './entity';
import { RoleService, UsersService } from './service';
import { RoleController, UsersController } from './controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CopyWallet, RoleModel, Privileges]),
  ],
  providers: [UsersService, RoleService, JwtStrategy],
  controllers: [UsersController, RoleController],
  exports: [UsersService, JwtStrategy, RoleService],
})
export class UsersModule {}
