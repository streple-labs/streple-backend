import { Public } from '@app/decorators';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto, RefreshToken } from './dto/login.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { ResetPasswordDto, VerifyTfaLogin } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { Throttle } from '@nestjs/throttler';
import { GoogleOauthGuard } from '@app/guards';
import { Role } from '@app/users/interface';
dotenv.config();

if (!process.env.FRONTEND_BASE_URL) {
  throw new Error('Missing FRONTEND_BASE_URL in environment variables');
}

@ApiTags('Auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    if (!req.user) return res.redirect(process.env.FRONTEND_BASE_URL as string);

    const { accessToken, role } = req.user as {
      accessToken: string;
      role?: Role;
    };

    // Set the token in a secure cookie
    res.cookie('streple_auth_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
    });

    // Type guard for role
    if (role && Object.values(Role).includes(role)) {
      if (role === Role.follower) {
        return res.redirect(process.env.FRONTEND_BASE_URL as string);
      }
      return res.redirect(process.env.ADMINS_FRONTEND_BASE_URL as string);
    }

    // Fallback redirect
    return res.redirect(process.env.FRONTEND_BASE_URL as string);
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
}
