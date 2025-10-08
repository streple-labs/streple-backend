/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuthUser, JwtPayload } from '@app/common';
import { IUser, Role } from '@app/users/interface';
import { UsersService } from '@app/users/service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { ResendOtpDto, VerifyOtpDto } from 'src/app/auth/dto/otp.dto';
import { jwtConstants } from './constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { ReferralService } from '@app/referral/referral.service';
import { SecurityService } from '@app/helpers';
import { TwoFAService } from '@app/users/service/twofa.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwtService: JwtService,
    private readonly referralService: ReferralService,
    private readonly security: SecurityService,
    private readonly twoFAService: TwoFAService,
  ) {}

  async register(dto: SignupDto) {
    const existing: IUser | null = await this.users.findByEmail(
      dto.email.toLowerCase(),
    );
    if (existing) {
      if (!existing.isVerified) {
        void this.resendOtp({ email: existing.email, purpose: 'verify' });
        throw new BadRequestException('Account not verified new Otp sent');
      }
      throw new BadRequestException('Email already in use');
    }

    const referDetails: {
      directReferrerId?: string | undefined;
      userId?: string | undefined;
    } = {};

    if (dto.referral) {
      const referral = await this.users.findOne({
        refercode: dto.referral,
      });

      if (!referral.data) {
        throw new ForbiddenException('Incorrect referral code');
      }

      if (!referral.data.isVerified) {
        throw new ForbiddenException('Referrer Account not verified');
      }

      referDetails.directReferrerId = referral.data.id;
    }

    const data = await this.users.createUser(dto);
    if (data) referDetails.userId = data.id;
    void this.referralService.create(referDetails);
    return data;
  }

  async verifyEmail(dto: VerifyOtpDto) {
    return this.users.verifyEmail({
      email: dto.email.toLowerCase(),
      otp: dto.otp,
    });
  }

  async resendOtp(dto: ResendOtpDto) {
    return this.users.resendOtp({
      email: dto.email.toLowerCase(),
      purpose: dto.purpose,
    });
  }

  async userLogin(dto: LoginDto) {
    const user = await this.users.login(dto.email.toLowerCase());
    if (!user || !(await user.validatePassword(dto.password))) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Email not verified');
    }

    if (![Role.follower].includes(user.role)) {
      throw new BadRequestException('Access denied users only');
    }

    const { password, createdAt, updatedAt, tfaSecret, ...sanitizedUser } =
      user;

    if (user.isTfaEnabled) {
      return {
        status: 'TFA_REQUIRED',
        message: 'Enter your 2FA code',
        email: sanitizedUser,
      };
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      username: user.username,
    };

    const access = await this.generateTokens(payload, '1h');
    const refresh = await this.generateTokens(payload, '2h');
    return {
      streple_auth_token: access,
      streple_refresh_token: refresh,
      token_type: 'Bearer',
      expires_in: jwtConstants.expiresIn,
      data: sanitizedUser,
    };
  }

  async adminLogin(dto: LoginDto) {
    const user = await this.users.login(dto.email.toLowerCase());
    if (!user || !(await user.validatePassword(dto.password))) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Email not verified');
    }

    if ([Role.follower].includes(user.role)) {
      throw new BadRequestException('Access denied');
    }

    const { password, createdAt, updatedAt, tfaSecret, ...sanitizedUser } =
      user;

    if (user.isTfaEnabled) {
      return {
        status: 'TFA_REQUIRED',
        message: 'Enter your 2FA code',
        data: sanitizedUser,
      };
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      username: user.username,
    };

    const access = await this.generateTokens(payload, '1h');
    const refresh = await this.generateTokens(payload, '2h');
    return {
      streple_auth_token: access,
      streple_refresh_token: refresh,
      token_type: 'Bearer',
      expires_in: jwtConstants.expiresIn,
      data: sanitizedUser,
    };
  }

  async verifyTfaLogin(email: string, tfaToken: string) {
    const user = await this.users.login(email.toLowerCase());
    if (!user) throw new BadRequestException('Invalid user');

    if (!user.isTfaEnabled || !user.tfaSecret) {
      throw new ForbiddenException('TFA is not enabled for this account');
    }

    const secret = await this.security.decrypt(user.tfaSecret);
    const isValid = this.twoFAService.verifyTfaCode(secret, tfaToken);

    if (!isValid) {
      throw new BadRequestException('Invalid TFA code');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      username: user.username,
    };

    const { password, createdAt, updatedAt, tfaSecret, ...sanitizedUser } =
      user;
    const access = await this.generateTokens(payload, '1h');
    const refresh = await this.generateTokens(payload, '2h');
    return {
      streple_auth_token: access,
      streple_refresh_token: refresh,
      token_type: 'Bearer',
      expires_in: jwtConstants.expiresIn,
      data: sanitizedUser,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return await this.users.forgotPassword({ email: dto.email.toLowerCase() });
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.users.verifyOtp({
      email: dto.email.toLowerCase(),
      otp: dto.otp,
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    return await this.users.resetPassword({
      email: dto.email.toLowerCase(),
      newPassword: dto.newPassword,
    });
  }

  async refreshToken(token: string) {
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      if (!payload) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const { iat, exp, ...rest } = payload;
      const access = await this.generateTokens(rest, '1h');
      const refresh = await this.generateTokens(rest, '2h');

      return { streple_access_token: access, streple_refresh_token: refresh };
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private generateTokens(user: AuthUser, expiresIn: string) {
    return this.jwtService.signAsync(user, {
      secret: jwtConstants.secret,
      expiresIn: expiresIn,
    });
  }
}
