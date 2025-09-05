import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  createReward,
  findManyReferral,
  findManyReward,
  findOneReferral,
  ReferralLevel,
  ReferralStatus,
  updatedReward,
} from './referral.interface';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FindMany, FindOne, transform } from '@app/common';

export class CreateReward implements createReward {
  @IsNumber()
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  amount: number;

  @IsString()
  @ApiProperty({ type: String, enum: Object.values(ReferralLevel) })
  @IsIn(Object.values(ReferralLevel))
  level: ReferralLevel;

  @IsInt()
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? parseInt(value) : value,
  )
  count: number;
}

export class UpdateReward
  extends PartialType(CreateReward)
  implements updatedReward {}

export class FindManyReferral extends FindMany implements findManyReferral {
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ReferralLevel))
  @ApiPropertyOptional({ type: String, enum: Object.values(ReferralLevel) })
  level?: ReferralLevel;

  @IsOptional()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @Transform(({ value }: { value: transform }) =>
    typeof value === 'string' ? [value] : value,
  )
  directReferrerId?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @Transform(({ value }: { value: transform }) =>
    typeof value === 'string' ? [value] : value,
  )
  indirectReferrerId?: string[];

  @IsString()
  @IsOptional()
  @IsIn(Object.values(ReferralStatus))
  @ApiPropertyOptional({ type: [String], enum: Object.values(ReferralStatus) })
  status?: ReferralStatus;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
  })
  hasBadge?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
  })
  exclusive?: boolean;
}

export class FindOneReferral extends FindOne implements findOneReferral {
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ReferralLevel))
  @ApiPropertyOptional({ type: String, enum: Object.values(ReferralLevel) })
  level?: ReferralLevel;

  @IsUUID()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  directReferrerId?: string;

  @IsUUID()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  indirectReferrerId?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(ReferralStatus))
  @ApiPropertyOptional({ type: String, enum: Object.values(ReferralStatus) })
  status?: ReferralStatus;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
  })
  hasBadge?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
  })
  exclusive?: boolean;
}

export class TopReferral {
  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ type: [Number] })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  limit: number = 10;
}

export class FindManyReward extends FindMany implements findManyReward {
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ReferralLevel))
  @ApiPropertyOptional({ type: String, enum: Object.values(ReferralLevel) })
  level?: ReferralLevel;
}
