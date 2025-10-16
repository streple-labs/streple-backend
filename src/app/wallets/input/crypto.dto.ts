import { IsString } from 'class-validator';

export class TransferCoin {
  @IsString()
  amount: string;

  @IsString()
  walletAddress: string;
}
