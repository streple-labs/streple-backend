import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'alice@streple.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd' })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword()
  @MinLength(8)
  newPassword: string;
}

export class VerifyTfaLogin {
  @ApiProperty({ type: String })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class PartnerShip {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  fullName: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  email: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  message?: string;
}
