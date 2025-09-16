import { ReferralModule } from '@app/referral/referral.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from '../../global/strategies/google.strategy';
import { JwtStrategy } from '../../global/strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { SecurityService } from '@app/helpers';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ReferralModule,
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, SecurityService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
