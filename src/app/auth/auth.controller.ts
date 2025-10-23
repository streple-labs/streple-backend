import { Public } from '@app/decorators';
import { GoogleOauthGuard } from '@app/guards';
import { Role } from '@app/users/interface';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { AuthRequest, LoginDto, RefreshToken } from './dto/login.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import {
  PartnerShip,
  ResetPasswordDto,
  VerifyTfaLogin,
} from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new account' })
  @ApiResponse({
    status: 201,
    description:
      'Returns a success message and the email address the OTP was sent to',
  })
  register(@Body() dto: SignupDto) {
    return this.auth.register(dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email to complete registration' })
  @ApiResponse({ status: 200, description: 'Returns a success message' })
  verifyEmail(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyEmail(dto);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: "Resend the OTP to the user's email address" })
  @ApiResponse({
    status: 200,
    description:
      'Returns a success message and the email address the OTP was sent to',
  })
  resend(@Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(dto);
  }

  @Post('login/user')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'User Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns a JWT token' })
  loginUser(@Body() dto: LoginDto) {
    return this.auth.userLogin(dto);
  }

  @Post('login/admin')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'User Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns a JWT token' })
  AdminLogin(@Body() dto: LoginDto) {
    return this.auth.adminLogin(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Create a new token for user' })
  @ApiBody({ type: RefreshToken })
  RefreshToken(@Body() body: RefreshToken) {
    return this.auth.refreshToken(body.token);
  }

  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  @ApiResponse({
    status: 302,
    description: 'Redirects the user to the Google OAuth consent screen.',
  })
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {}

  // Callback after Google login
  @Get('google/redirect')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Returns a success message and user info after Google login.',
  })
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: AuthRequest, @Res() res: Response) {
    const { user } = req.user;

    // if (user.isTfaEnabled) {
    //   return res.redirect(`http://localhost:5173?email=${user.email}`);
    // }

    const authUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwt.sign(authUser, {
      expiresIn: '1h',
    });

    // Set the token in a secure cookie
    res.cookie('streple_auth_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
    });

    // Type guard for role
    if (user.role && Object.values(Role).includes(user.role)) {
      if (user.role === Role.follower) {
        return res.redirect(this.configService.getOrThrow('FRONTEND_BASE_URL'));
      }
      return res.redirect(
        this.configService.getOrThrow('ADMINS_FRONTEND_BASE_URL'),
      );
    }

    // Fallback redirect
    return res.redirect(this.configService.getOrThrow('FRONTEND_BASE_URL'));
  }

  // generate otp send otp to email
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify otp to complete password reset' })
  @ApiResponse({ status: 200, description: 'Returns a success message' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  // verify otp and enter new password
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('verify-tfa')
  async VerifyTFA(@Body() dto: VerifyTfaLogin) {
    return this.auth.verifyTfaLogin(dto.email, dto.code);
  }

  @Post('partnership')
  @ApiOperation({ summary: 'Submit request for partnership' })
  async PartnerShip(@Body() payload: PartnerShip) {
    return this.auth.partnership(payload);
  }

  @Post('support')
  @ApiOperation({ summary: 'Submit complain for support' })
  async Support(@Body() payload: PartnerShip) {
    return this.auth.partnership(payload);
  }
}
