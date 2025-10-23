import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'Alice Streple' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'alice@streple.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd' })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    {
      message:
        'Atleast 8+ character, 1 upper, 1 lower, 1 digit, 1 special letter.',
    },
  )
  password: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  referral?: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}
