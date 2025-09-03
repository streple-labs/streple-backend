import { ForgotPasswordDto } from '@app/auth/dto/forgot-password.dto';
import { ResendOtpDto, VerifyOtpDto } from '@app/auth/dto/otp.dto';
import { ResetPasswordDto } from '@app/auth/dto/reset-password.dto';
import { SignupDto } from '@app/auth/dto/signup.dto';
import { AuthUser, Document, DocumentResult } from '@app/common';
import { CopyWallet } from '@app/copy-trading/entities';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from '@app/helpers';
import { MailService, template } from '@app/services';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { toggle } from '../dto/toggle-role.dto';
import { TopUpDto } from '../dto/top-up.dto';
import { RoleModel, User } from '../entity';
import {
  authType,
  createUser,
  findManyUser,
  findOneUser,
  IUser,
  Role,
  updateProfile,
  userType,
} from '../interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(CopyWallet)
    private readonly wallets: Repository<CopyWallet>,
    @InjectRepository(RoleModel)
    private readonly roleModel: Repository<RoleModel>,
    private readonly mailer: MailService,
  ) {}

  /* ---------------- registration / lookup ------------------ */
  async createUser(dto: SignupDto) {
    const user = this.repo.create(dto);
    user.password = await bcrypt.hash(dto.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const role = await this.roleModel.findOne({
      where: { name: Role.follower },
    });

    if (role) user.roles = role;

    await this.repo.save({
      ...user,
      auth_type: authType.email,
      type: userType.external,
      roleLevel: 1,
    });
    await this.mailer.sendMail(
      user.email,
      template.reg,
      'Verify Your Email Address to Complete Registration',
      { otp, username: user.fullName, currentYear: new Date().getFullYear() },
    ); //Service.sendOtpEmail(user.email, otp, 'verify');

    return { message: 'OTP sent to your email', email: user.email };
  }

  async createUserWithGoogle(dto: SignupDto): Promise<User> {
    const user = this.repo.create(dto);
    user.password = await bcrypt.hash(dto.password, 10);
    user.isVerified = true;
    const role = await this.roleModel.findOne({
      where: { name: Role.follower },
    });

    if (role) user.roles = role;

    return this.repo.save({ ...user, auth_type: authType.oath });
  }

  async createAdmin(dto: createUser) {
    const adminExists = await this.findByEmail(dto.email);
    if (adminExists) throw new BadRequestException('Admin already exists');

    const pass = this.generatePassword(10);
    const password = await bcrypt.hash(pass, 10);
    const role = await this.roleModel.findOne({ where: { name: dto.role } });
    if (role) {
      dto.roles = role;
    }

    const admin = this.repo.create({
      ...dto,
      isVerified: true,
      otpVerified: true,
      password,
      auth_type: authType.email,
      type: userType.internal,
    });

    await this.repo.save(admin);
    await this.mailer.sendMail(
      dto.email,
      template.admin,
      `Welcome dear ${dto.role?.toLowerCase()}`,
      {
        username: dto.fullName,
        email: dto.email,
        password: pass,
        login_url: '',
        currentYear: new Date().getFullYear(),
      },
    );
    return { message: 'Admin account created successfully' };
  }

  async login(email: string) {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
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

    await this.mailer.sendMail(
      user.email,
      template.resend,
      'Streple otp request',
      {
        otp: newOtp,
        username: user.fullName,
        currentYear: new Date().getFullYear(),
      },
    ); //Service.sendOtpEmail(user.email, newOtp, dto.purpose);
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

    await this.mailer.sendMail(
      user.email,
      template.reset,
      'Password Reset Request',
      { username: user.fullName, otp, currentYear: new Date().getFullYear() },
    );
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
  async toggleRole(id: string, dto: toggle) {
    const user = await this.findById(id);
    if (!user) {
      throw new ForbiddenException('user with this id not available');
    }

    const role = await this.roleModel.findOne({
      where: { name: dto.role },
    });

    user.role = dto.role;
    if (role) {
      dto.roles = role;
      user.roles = role;
    }

    await this.repo.update({ id: user.id }, { ...dto });
    return user;
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

  async findMany(query: findManyUser): Promise<DocumentResult<User>> {
    const { page, sort, limit, include, search, ...filter } = query;
    const where = this.filter(filter);
    const qb = this.repo.createQueryBuilder('user');

    buildFindManyQuery(
      qb,
      'user',
      where,
      search,
      ['fullName', 'email'],
      include,
      sort,
    );

    return FindManyWrapper(qb, page, limit);
  }

  async findOne(query: findOneUser): Promise<Document<User>> {
    const { include, sort, ...filters } = query;

    return FindOneWrapper<User>(this.repo, {
      include,
      sort,
      filters,
    });
  }

  async updateProfile(data: updateProfile, user: AuthUser): Promise<IUser> {
    const findUser = await this.repo.findOne({ where: { id: user.id } });
    if (!findUser) {
      throw new ForbiddenException('User not found');
    }

    await this.repo.update({ id: user.id }, { ...data });

    return findUser;
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

  private filter(query: findManyUser) {
    const where: Record<string, any> = {};

    if (query.email) {
      where['email'] = query.email;
    }

    if (query.fullName) {
      where['fullName'] = query.fullName;
    }

    if (query.isVerified) {
      where['isVerified'] = query.isVerified;
    }

    if (query.type) {
      where['type'] = query.type;
    }

    if (query.roleName) {
      where['role'] = query.roleName;
    }

    return where;
  }

  private generatePassword = (length: number = 10): string => {
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (length < 8) {
      throw new Error('Password length must be at least 8 characters long.');
    }

    const allChars = upperCase + lowerCase + numbers + symbols;
    let password = '';

    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    password = password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

    return password;
  };
}
