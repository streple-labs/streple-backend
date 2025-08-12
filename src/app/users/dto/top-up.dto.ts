import { FindMany, FindOne, transform } from '@app/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  createUser,
  findManyUser,
  findOneUser,
  updateProfile,
  Role,
  userType,
} from '../interface';

export class TopUpDto {
  @ApiProperty({ example: 500, minimum: 1 })
  @IsNumber()
  @Min(1) // must be at least $1
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  amount: number;
}

export class FindManyUser extends FindMany implements findManyUser {
  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  fullName?: string[];

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  @IsEmail({}, { each: true })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  email?: string[];

  @IsOptional()
  @IsBoolean({ each: true })
  @ApiProperty({ type: [Boolean] })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v === 'true' || v === true);
    }
    if (value === 'true' || value === true) return [true];
    if (value === 'false' || value === false) return [false];
    return;
  })
  isVerified?: boolean[];

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  roleName?: string[];

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  privilege?: string[];
}

export class FindOneUser extends FindOne implements findOneUser {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : null))
  fullName?: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : null))
  email?: string;
}

export class UpdateProfile implements updateProfile {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  howFamiliarWithTrading: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  expectationFromStreple: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  fullName: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  bio?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  avatarUrl?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
  })
  hasAnswer: boolean;
}

export class CreateUser implements createUser {
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
  @ApiProperty({ type: String, enum: Object.values(Role) })
  @IsIn([Role.admin, Role.marketer, Role.pro, Role.publish])
  role: Role;

  @IsInt()
  @ApiProperty({ type: Number })
  @IsIn([2, 3])
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  roleLevel: number;

  @IsOptional()
  @IsIn(Object.values(userType))
  type: userType = userType.internal;
}
