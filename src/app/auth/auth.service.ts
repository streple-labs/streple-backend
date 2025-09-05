import { AuthUser, JwtPayload } from '@app/common';
import { IUser, Role } from '@app/users/interface';
import { UsersService } from '@app/users/service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ResendOtpDto, VerifyOtpDto } from 'src/app/auth/dto/otp.dto';
import { jwtConstants } from './constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { ReferralService } from '@app/referral/referral.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwtService: JwtService,
    private readonly referralService: ReferralService,
  ) {}

  async register(dto: SignupDto) {
    const existing: IUser | null = await this.users.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already in use');

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
    referDetails.userId = data.id;
    void this.referralService.create(referDetails);
    return data;
  }

  async verifyEmail(dto: VerifyOtpDto) {
    return this.users.verifyEmail(dto);
  }

  async resendOtp(dto: ResendOtpDto) {
    return this.users.resendOtp(dto);
  }

  async userLogin(dto: LoginDto) {
    const user = await this.users.login(dto.email);
    if (!user || !(await user.validatePassword(dto.password))) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Email not verified');
    }

    if (![Role.follower].includes(user.role)) {
      throw new ForbiddenException('access denied users only');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, createdAt, updatedAt, ...sanitizedUser } = user;
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
    const user = await this.users.login(dto.email);
    if (!user || !(await user.validatePassword(dto.password))) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Email not verified');
    }

    if (
      ![
        Role.admin,
        Role.publish,
        Role.superAdmin,
        Role.marketer,
        Role.pro,
      ].includes(user.role)
    ) {
      throw new ForbiddenException('Access denied');
    }
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, createdAt, updatedAt, ...sanitizedUser } = user;
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
    return await this.users.forgotPassword(dto);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.users.verifyOtp(dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return await this.users.resetPassword(dto);
  }

  async refreshToken(token: string) {
    const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { iat, exp, ...rest } = payload;
    const access = await this.generateTokens(rest, '1h');
    const refresh = await this.generateTokens(rest, '2h');

    return { streple_access_token: access, streple_refresh_token: refresh };
  }

  private generateTokens(user: AuthUser, expiresIn: string) {
    return this.jwtService.signAsync(user, {
      secret: jwtConstants.secret,
      expiresIn: expiresIn,
    });
  }
}
