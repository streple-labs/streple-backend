import { FindMany, FindOne, transform } from '@app/common';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  action,
  copyTrade,
  createTrade,
  direction,
  duration,
  findManyTrade,
  findOneTrade,
  positionSize,
  riskLevel,
  status,
  type,
} from './traders.interface';

export class followTrader {}

export class CreateTrade implements createTrade {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  asset: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  leverage: string;

  @IsString()
  @IsIn(Object.values(positionSize))
  @ApiProperty({ type: String, enum: Object.values(positionSize) })
  positionSize: positionSize;

  @IsString()
  @IsIn(Object.values(duration))
  @ApiProperty({ type: String, enum: Object.values(duration) })
  duration: duration;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  comment?: string;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional({ type: Date })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  startDate: Date;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional({ type: Date })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? new Date(value) : value,
  )
  endDate: Date;

  @IsNumber()
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  entryPrice: number;

  @IsString()
  @ApiProperty({ type: String, enum: Object.values(direction) })
  @IsIn(Object.values(direction))
  direction: direction;

  @IsNumber()
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  stopLoss: number;

  @IsNumber()
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  takeProfit: number;

  @IsNumber()
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  stakeAmount: number;

  @IsString()
  @ApiProperty({ type: String, enum: Object.values(action) })
  @IsIn(Object.values(action))
  action: action;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String })
  riskLevel: riskLevel;
}

export class UpdateTrade extends PartialType(CreateTrade) {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String, enum: Object.values(status) })
  status: status;
}

export class FindManyTrade extends FindMany implements findManyTrade {
  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @Transform(({ value }: { value: transform }) =>
    typeof value === 'string' ? [value] : value,
  )
  creatorId?: string[];

  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @Transform(({ value }: { value: transform }) =>
    typeof value === 'string' ? [value] : value,
  )
  userId?: string[];

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString({ each: true })
  @Transform(({ value }: { value: transform }) =>
    typeof value === 'string' ? [value] : value,
  )
  symbol?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsIn(Object.values(status), { each: true })
  @ApiPropertyOptional({ type: String, enum: Object.values(status) })
  status?: status[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, enum: Object.values(type) })
  type?: type;
}

export class FindOneTrade extends FindOne implements findOneTrade {
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  creatorId?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  symbol?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String, enum: Object.values(status) })
  @IsIn(Object.values(status))
  status?: status;
}

export class CopyTrade implements copyTrade {
  @IsString()
  @IsUUID()
  @ApiProperty({ type: String, format: 'uuid' })
  tradeId: string;

  @IsNumber()
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  stakeAmount: number;
}

export class Parameter {
  @IsString()
  @IsUUID()
  tradeId: string;
}
