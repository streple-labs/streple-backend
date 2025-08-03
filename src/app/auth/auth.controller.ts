import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@app/decorators';

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

  @Post('login')
  @ApiOperation({ summary: 'User Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns a JWT token' })
  loginUser(@Body() dto: LoginDto) {
    return this.auth.loginUser(dto);
  }

  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  @ApiResponse({
    status: 302,
    description: 'Redirects the user to the Google OAuth consent screen.',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard handles redirection
  }

  // Callback after Google login
  @Get('google/redirect')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Returns a success message and user info after Google login.',
  })
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = req.user as any;

    // Set the token in a secure cookie
    res.cookie('streple_auth_token', accessToken, {
      httpOnly: true, // Cannot be accessed via JavaScript
      secure: true, // Only sent over HTTPS
      sameSite: 'lax', // Protects against CSRF for most cases
      maxAge: 1000 * 60 * 60, // 1 hour
    });

    // Redirect to dashboard
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
}
