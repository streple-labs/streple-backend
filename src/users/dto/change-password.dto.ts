// users/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'alice@streple.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'CurrentP@ssw0rd',
    description: 'Current user password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({
    example: 'NewP@ssw0rd',
    description: 'New desired password, min 8 chars',
  })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword()
  @MinLength(8)
  newPassword: string;
}
