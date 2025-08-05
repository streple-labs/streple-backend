import { Role } from '@app/users/interface';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ResendOtpDto, VerifyOtpDto } from 'src/app/auth/dto/otp.dto';
import { UsersService } from '../users/users.service';
import { jwtConstants } from './constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: SignupDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already in use');

    return await this.users.createUser(dto);
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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    if (![Role.follower, Role.pro].includes(user.role)) {
      throw new UnauthorizedException('access denied users only');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, createdAt, updatedAt, ...sanitizedUser } = user;
    return {
      streple_auth_token: this.jwt.sign(payload),
      token_type: 'Bearer',
      expires_in: jwtConstants.expiresIn,
      data: sanitizedUser,
    };
  }

  async adminLogin(dto: LoginDto) {
    const user = await this.users.login(dto.email);
    if (!user || !(await user.validatePassword(dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    if (![Role.admin, Role.publish, Role.superAdmin].includes(user.role)) {
      throw new UnauthorizedException('Access denied');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, createdAt, updatedAt, ...sanitizedUser } = user;
    return {
      streple_auth_token: this.jwt.sign(payload),
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
}
