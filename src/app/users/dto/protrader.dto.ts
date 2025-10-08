import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  createProTrader,
  findManyProTrader,
  findOneProTrader,
} from '../interface';
import { ApiProperty } from '@nestjs/swagger';
import { FindMany, FindOne, transform } from '@app/common';
import { Transform } from 'class-transformer';

export class CreateProtrader implements createProTrader {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: 'John Doe' })
  name: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: 'johndeo@gmail.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: '5 years' })
  tradingExperience: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: 'Binance, Coinbase' })
  exchangesUsed: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ type: [String], example: ['@johndoe', 'twitter.com/johndoe'] })
  socialHandlers?: string[];
}

export class FindManyProTrader extends FindMany implements findManyProTrader {
  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  name?: string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  @IsString({ each: true })
  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  email?: string[];
}

export class FindOneProTrader extends FindOne implements findOneProTrader {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsString()
  @IsOptional()
  email?: string;
}
