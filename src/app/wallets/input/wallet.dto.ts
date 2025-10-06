import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  baseCurrency,
  convert,
  findManyTransaction,
  findOneTransaction,
  transactionStatus,
  transactionType,
} from './wallet.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { FindMany, FindOne, transform } from '@app/common';

export class Wallet {}

export class Convert implements convert {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'usd',
    description: 'Currency to convert from',
  })
  from: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'ngn',
    description: 'Currency to convert to',
  })
  to: string;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @ApiProperty({ type: Number, example: 100, description: 'Amount to convert' })
  amount: number;
}

export class BaseCurrency implements baseCurrency {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'usd',
    description: 'Base currency for rates',
  })
  base: string = 'usd';
}

export class FindManyTransaction
  extends FindMany
  implements findManyTransaction
{
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiProperty({
    type: [String],
    example: 'uuid',
    description: 'Filter by userId',
    required: false,
  })
  userId?: string[];

  @IsString()
  @IsOptional()
  @IsIn(Object.values(transactionType), { message: 'Invalid transaction type' })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiProperty({
    type: String,
    example: transactionType.tra,
    enum: Object.values(transactionType),
    description: 'Filter by transaction type',
    required: false,
  })
  type?: transactionType;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(transactionStatus), {
    message: 'Invalid transaction status',
  })
  @ApiProperty({
    type: String,
    example: transactionStatus.success,
    enum: Object.values(transactionStatus),
    description: 'Filter by transaction status',
    required: false,
  })
  status?: transactionStatus;

  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiProperty({
    type: [String],
    example: 'reference',
    description: 'Filter by reference',
    required: false,
  })
  reference?: string[];

  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiProperty({
    type: [String],
    example: 'uuid',
    description: 'Filter by recipientId',
    required: false,
  })
  recipientId?: string[];

  @IsNumber({}, { each: true })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string'
      ? value.split(',').map((val) => Number(val))
      : value,
  )
  @ApiProperty({
    type: [Number],
    example: [100, 200],
    description: 'Filter by amount',
    required: false,
  })
  amount?: number[];
}

export class FindOneTransaction extends FindOne implements findOneTransaction {
  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    example: 'uuid',
    description: 'Filter by userId',
    required: false,
  })
  userId?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(transactionType), { message: 'Invalid transaction type' })
  @ApiProperty({
    type: String,
    example: transactionType.tra,
    enum: Object.values(transactionType),
    description: 'Filter by transaction type',
    required: false,
  })
  type?: transactionType;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(transactionStatus), {
    message: 'Invalid transaction status',
  })
  @ApiProperty({
    type: String,
    example: transactionStatus.success,
    enum: Object.values(transactionStatus),
    description: 'Filter by transaction status',
    required: false,
  })
  status?: transactionStatus;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    example: 'reference',
    description: 'Filter by reference',
    required: false,
  })
  reference?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Filter by amount',
    required: false,
  })
  amount?: number;
}
