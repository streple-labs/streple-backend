// otp.dto.ts
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type OtpPurpose = 'verify' | 'reset';

export class VerifyOtpDto {
  @ApiProperty({ example: 'alice@streple.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6, { message: 'OTP must be exactly 6 characters long' })
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'alice@streple.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'verify', enum: ['verify', 'reset'] })
  @IsIn(['verify', 'reset'])
  purpose: OtpPurpose;
}
