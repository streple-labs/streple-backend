import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
