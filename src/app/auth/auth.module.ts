import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../../global/strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { CopyTradingModule } from 'src/app/copy-trading/copy-trading.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from '../../global/strategies/google.strategy';

@Module({
  imports: [
    UsersModule,
    CopyTradingModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      // signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
