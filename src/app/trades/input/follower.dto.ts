import { IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  createFollower,
  curve,
  Period,
  profilePerformance,
} from './follower.interface';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateFollower implements createFollower {
  @IsUUID()
  @IsString()
  @ApiProperty({ type: String, format: 'uuid' })
  followingId: string;
}

export class FilterWithUserId {
  @IsUUID()
  @IsString()
  @ApiProperty({ type: String, format: 'uuid' })
  traderId: string;
}

export class ProfilePerformance implements profilePerformance {
  @IsString()
  @IsOptional()
  @IsIn(['daily', '7D', '30D', '90D'])
  @ApiPropertyOptional({ type: String, enum: ['daily', '7D', '30D', '90D'] })
  period: Period = 'daily';

  @IsUUID()
  @IsString()
  @ApiProperty({ type: String, format: 'uuid' })
  userId: string;
}

export class Curve implements curve {
  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? parseInt(value) : value,
  )
  period: number = 7;

  @IsUUID()
  @IsString()
  @ApiProperty({ type: String, format: 'uuid' })
  userId: string;
}
