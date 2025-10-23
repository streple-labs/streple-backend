import { IUser } from '@app/users/interface';
import { FeeLevel } from '@circle-fin/developer-controlled-wallets';

export interface WalletSets {
  id: string;
  walletId: string;
  custodyType: string;
  name: string;
  isActive: boolean;
  updateDate: Date;
  createDate: Date;
}

export interface CryptoWallet {
  id: string;
  circleId: string; //id of the response from circle
  state: string; //LIVE
  walletSetId: string;
  walletSet: WalletSets;
  custodyType: string; //'DEVELOPER';
  address: string;
  blockchain: string;
  initialPublicKey?: string;
  name?: string;
  refId?: string;
  circleUserId?: string;
  userId: string;
  user: IUser;
  accountType: string; //'SCA';
  scaCore: string; //'circle_6900_singleowner_v3';
  updateDate: Date;
  createDate: Date;
}

export interface balanceResponse {
  token: {
    id: string;
    blockchain: string;
    tokenAddress: string;
    standard: string; //'ERC20';
    name: string; //'USDC';
    symbol: string; //'USDC';
    decimals: string; //6;
    isNative: boolean;
    updateDate: Date;
    createDate: Date;
  };
  amount: string;
  updateDate: Date;
}

export interface cryptoTransfer {
  amount: string;
  walletAddress: string;
  feeLevel: FeeLevel;
  transactionPin: string;
}
