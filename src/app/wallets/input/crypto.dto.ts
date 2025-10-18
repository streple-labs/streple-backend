import { IsEnum, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { cryptoTransfer } from './crypto.interface';
import { FeeLevel } from '@circle-fin/developer-controlled-wallets';
import { ApiProperty } from '@nestjs/swagger';

export class TransferCoin implements cryptoTransfer {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: '2' })
  amount: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  @IsEnum(['HIGH', 'LOW', 'MEDIUM'])
  @IsIn(['HIGH', 'LOW', 'MEDIUM'])
  feeLevel: FeeLevel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  @ApiProperty({ type: String })
  transactionPin: string;
}
