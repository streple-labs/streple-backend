import { FindMany, FindOne } from '@app/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  BalanceMode,
  BalanceType,
  findManyTransaction,
  findOneTransaction,
  TransactionStatus,
  TransactionType,
  transfer,
  userBalance,
} from '../interface';

export class FindManyTransaction
  extends FindMany
  implements findManyTransaction
{
  @IsOptional()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  user?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsIn(Object.values(BalanceType), { each: true })
  @ApiPropertyOptional({ type: [String], enum: Object.values(BalanceType) })
  type?: BalanceType[];

  @IsOptional()
  @IsString({ each: true })
  @IsIn(Object.values(BalanceMode), { each: true })
  @ApiPropertyOptional({ type: [String], enum: Object.values(BalanceMode) })
  mode?: BalanceMode[];

  @IsOptional()
  @IsString({ each: true })
  @IsIn(Object.values(TransactionType), { each: true })
  @ApiPropertyOptional({ type: [String], enum: Object.values(TransactionType) })
  transactionType?: TransactionType[];

  @IsOptional()
  @IsString({ each: true })
  @IsIn(Object.values(TransactionStatus), { each: true })
  @ApiPropertyOptional({
    type: [String],
    enum: Object.values(TransactionStatus),
  })
  status?: TransactionStatus[];
}

export class FindOneTransaction extends FindOne implements findOneTransaction {
  @IsUUID()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  user?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(BalanceType))
  @ApiPropertyOptional({ type: String, enum: Object.values(BalanceType) })
  type?: BalanceType;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(BalanceMode))
  @ApiPropertyOptional({ type: String, enum: Object.values(BalanceMode) })
  mode?: BalanceMode;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(TransactionType))
  @ApiPropertyOptional({ type: String, enum: Object.values(TransactionType) })
  transactionType?: TransactionType;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(TransactionStatus))
  @ApiPropertyOptional({ type: String, enum: Object.values(TransactionStatus) })
  status?: TransactionStatus;
}

export class UserBalance implements userBalance {
  @IsString()
  @IsOptional()
  @IsIn(Object.values(BalanceType))
  @ApiPropertyOptional({ type: String, enum: Object.values(BalanceType) })
  type?: BalanceType;

  @IsString()
  @IsIn(Object.values(BalanceMode))
  @ApiProperty({ type: String, enum: Object.values(BalanceMode) })
  mode: BalanceMode;
}

export class Transfer implements transfer {
  @IsNumber()
  @IsPositive()
  @ApiProperty({ type: Number })
  amount: number;

  @IsString()
  @IsIn(Object.values(BalanceType))
  @ApiProperty({ type: String, enum: Object.values(BalanceType) })
  fromAccount: BalanceType;

  @IsString()
  @IsIn(Object.values(BalanceType))
  @ApiProperty({ type: String, enum: Object.values(BalanceType) })
  toAccount: BalanceType;

  @IsString()
  @IsIn(Object.values(BalanceMode))
  @ApiProperty({ type: String, enum: Object.values(BalanceMode) })
  mode: BalanceMode;
}
