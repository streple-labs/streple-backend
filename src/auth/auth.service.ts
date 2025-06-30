import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { ResendOtpDto, VerifyOtpDto } from 'src/auth/dto/otp.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from 'src/users/enums/role.enum';
import { jwtConstants } from './constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

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

  async verifyOtp(dto: VerifyOtpDto) {
    return this.users.verifyOtp(dto);
  }

  async resendOtp(dto: ResendOtpDto) {
    return this.users.resendOtp(dto);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.users.findByEmail(email);
    if (user && user.password === pass) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await user.validatePassword(dto.password))) {
      throw new UnauthorizedException('Bad credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.makeJwt(payload);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return await this.users.forgotPassword(dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return await this.users.resetPassword(dto);
  }

  private makeJwt(payload: JwtPayload) {
    return {
      streple_auth_token: this.jwt.sign(payload),
      token_type: 'Bearer',
      expires_in: jwtConstants.expiresIn,
    };
  }
}
