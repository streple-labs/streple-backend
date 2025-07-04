import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SignupDto } from '../auth/dto/signup.dto';
import { ResendOtpDto, VerifyOtpDto } from 'src/auth/dto/otp.dto';
import * as bcrypt from 'bcrypt';
import { ToggleRoleDto } from './dto/toggle-role.dto';
import { TopUpDto } from './dto/top-up.dto';
import { CopyWallet } from '../copy-trading/entities/copy-wallet.entity';
import { MailerService } from 'src/auth/mailer.service';
import { ForgotPasswordDto } from 'src/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly mailerService: MailerService,
    @InjectRepository(CopyWallet)
    private readonly wallets: Repository<CopyWallet>,
  ) {}

  /* ---------------- registration / lookup ------------------ */
  async createUser(dto: SignupDto) {
    const user = this.repo.create(dto);
    user.password = await bcrypt.hash(dto.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await this.repo.save(user);
    await this.mailerService.sendOtpEmail(user.email, otp, 'verify');

    return { message: 'OTP sent to your email', email: user.email };
  }

  async createUserWithGoogle(dto: SignupDto): Promise<User> {
    const user = this.repo.create(dto);
    user.password = await bcrypt.hash(dto.password, 10);
    user.isVerified = true;
    return this.repo.save(user);
  }

  async findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    return user;
  }

  async verifyEmail(dto: VerifyOtpDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified)
      throw new BadRequestException('Email already verified');
    if (!user.otp || dto.otp !== user.otp)
      throw new BadRequestException('Invalid OTP');
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date())
      throw new BadRequestException('OTP expired');

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await this.repo.save(user);

    return { message: 'Email verified successfully' };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    if (user.otpVerified) throw new BadRequestException('OTP already verified');

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = newOtp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpVerified = false;
    await this.repo.save(user);

    await this.mailerService.sendOtpEmail(user.email, newOtp, dto.purpose);
    return { message: 'OTP resent', email: user.email };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpVerified = false;
    await this.repo.save(user);

    await this.mailerService.sendOtpEmail(user.email, otp, 'reset');
    return { message: 'OTP sent to your email', email: user.email };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    if (user.otpVerified) throw new BadRequestException('OTP already verified');
    if (!user.otp || dto.otp !== user.otp)
      throw new BadRequestException('Invalid OTP');
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date())
      throw new BadRequestException('OTP expired');

    user.otp = null;
    user.otpExpiresAt = null;
    user.otpVerified = true;
    await this.repo.save(user);

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    if (!user.otpVerified) throw new UnauthorizedException('OTP not verified');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.repo.save(user);

    return { message: 'Your password has been reset successfully' };
  }

  async changePassword(dto: ChangePasswordDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch)
      throw new BadRequestException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.repo.save(user);
    return { message: 'Password changed successfully' };
  }

  /* ---------------- role toggle ---------------------------- */
  async toggleRole(id: string, dto: ToggleRoleDto) {
    const user = await this.findById(id);
    user.role = dto.role;
    return this.repo.save(user);
  }

  async getProfile(userId: string) {
    const user = await this.repo.findOne({
      where: { id: userId },
      select: [
        'id',
        'fullName',
        'email',
        'bio',
        'avatarUrl',
        'stats',
        'followerCount',
        'performanceHistory',
        'role',
        'createdAt',
      ],
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /* ---------------- dashboard ------------------------------ */
  async getDashboard(id: string) {
    const user = await this.findById(id);
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      stats: user.stats,
      followerCount: user.followerCount,
      performanceHistory: user.performanceHistory,
      demoFundingBalance: user.demoFundingBalance,
      createdAt: user.createdAt,
    };
  }

  /* ---------------- demo funding getter -------------------- */
  async getDemoFunding(id: string) {
    const user = await this.findById(id);
    return {
      demoFundingBalance: user.demoFundingBalance,
    };
  }

  /* ---------------- demo funding top-up -------------------- */
  async topUpDemoFunding(id: string, dto: TopUpDto) {
    const amt = Number(dto.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const user = await this.findById(id);
    user.demoFundingBalance = Number(user.demoFundingBalance) + amt;
    return this.repo.save(user);
  }

  /* ---------------- wallet tracking ------------------------ */
  async getCopyWallets(userId: string) {
    return this.wallets.find({
      where: { user: { id: userId } },
      relations: ['proTrader'],
    });
  }

  /* add convenience for stats updates, followers etc later */
}
