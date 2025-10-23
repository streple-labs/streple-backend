import { IUser } from '@app/users/interface';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Request } from 'express';
export class LoginDto {
  @ApiProperty({ example: 'alice@streple.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd' })
  @IsString()
  @IsStrongPassword()
  password: string;
}

export class RefreshToken {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export interface AuthRequest extends Request {
  user: { user: IUser };
}
