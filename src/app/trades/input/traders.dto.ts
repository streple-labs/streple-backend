import { FindMany, FindOne, transform } from '@app/common';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  action,
  copyTrade,
  createTrade,
  duration,
  findManyTrade,
  findOneTrade,
  orderType,
  positionSize,
  status,
  type,
} from './traders.interface';

export class followTrader {}

class PositionSize implements positionSize {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'stakeAmount must be a valid number' },
  )
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  amount: number;

  @IsString()
  @IsIn(['USDT', 'BTC'])
  @ApiProperty({ type: String, enum: ['USDT', 'BTC'] })
  currency: 'USDT' | 'BTC';
}
export class CreateTrade implements createTrade {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  asset: string;

  @IsNumber()
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  leverage: number;

  @IsObject()
  @Type(() => PositionSize)
  @ValidateNested({ each: true })
  @ApiProperty({ type: PositionSize })
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
  @IsOptional()
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  entryPrice: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'stakeAmount must be a valid number' },
  )
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  stopLoss: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'stakeAmount must be a valid number' },
  )
  @ApiProperty({ type: Number })
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'string' ? parseFloat(value) : value,
  )
  takeProfit: number;

  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return false;
  })
  @ApiProperty({ type: Boolean })
  isDraft: boolean;

  @IsString()
  @ApiProperty({ type: String, enum: Object.values(action) })
  @IsIn(Object.values(action))
  action: action;

  @IsString()
  @IsIn(Object.values(orderType))
  @ApiProperty({ type: String, enum: Object.values(orderType) })
  orderType: orderType;
}

export class UpdateTrade extends PartialType(CreateTrade) {}

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

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return value;
  })
  draft?: boolean;
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
}

export class Parameter {
  @IsString()
  @IsUUID()
  tradeId: string;
}
