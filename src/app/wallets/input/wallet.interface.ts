import { findMany, findOne } from '@app/common';
import { IUser } from '@app/users/interface';

export enum walletSymbol {
  naira = 'NGN',
  usdc = 'USDC',
  dollar = 'USD',
  btc = 'BTC',
  eth = 'ETH',
  stp = 'STP',
}

export enum transactionType {
  dep = 'deposit',
  wit = 'withdraw',
  tra = 'transfer',
  con = 'conversion',
}

export enum walletStatus {
  active = 'Active',
  warning = 'Warning',
  block = 'Blocked',
  suspend = 'Suspended',
}

export enum transactionStatus {
  success = 'Successful',
  pending = 'Pending',
  fail = 'Failed',
}

export interface IWallets {
  id: string;
  balance: number;
  currency: walletSymbol;
  user: IUser;
  transactions: ITransaction[];
  status: walletStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  id: string;
  wallet: IWallets;
  type: transactionType;
  userId: string;
  amount: number;
  reference: string;
  recipient?: IUser;
  user: IUser;
  idempotency?: string;
  description: string;
  previousBal: number;
  currentBal: number;
  status: transactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type txnHistory = Omit<
  ITransaction,
  'id' | 'createdAt' | 'updatedAt' | 'user'
>;

export interface IAccount {
  id: string;
  reference: string;
  wallet: number;
  walletName: string;
  bankName: string;
  accountNumber: number;
  userId: string;
  user: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface internalTransfer {
  amount: number;
  username: string;
  senderCurrency: walletSymbol;
  recipientCurrency: walletSymbol;
  idempotency: string;
  transactionPin: string;
}

export interface funding {
  amount: number;
  currency: walletSymbol;
  idempotency?: string;
  paymentMethod?: 'card' | 'bank';
  source?: string;
}

export interface virtualAccountResponse {
  status: string;
  data: {
    code: string;
    payments: {
      walletName: string;
      wallet: number;
      bankName: string;
      accountNumber: number;
      reference: string;
    };
    message: string;
  };
}

export interface getEncryptedData {
  status: string;
  data: {
    code: string;
    EncryptedSecKey: {
      encryptedKey: string;
    };
    message: string;
  };
}

export interface ratesResponse {
  rates: {
    [key: string]: { name: string; unit: string; value: number; type: string };
  };
}

export interface usdcResponse {
  [key: string]: { usd: number; ngn: number };
}

export interface fiatRatesResponse {
  result: string;
  provider: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: Date;
  time_last_update_utc: Date;
  time_next_update_unix: Date;
  time_next_update_utc: Date;
  time_eol_unix: number;
  base_code: string;
  rates: {
    [key: string]: number;
  };
}

export interface convertResponse {
  amount: number;
  from: string;
  to: string;
  converted: number;
  rate: number;
}

export interface convert {
  from: string;
  to: string;
  amount: number;
}

export interface baseCurrency {
  base: string;
}

export interface fetchRatesResponse {
  fiatRates: fiatRatesResponse;
  cryptoRates: usdcResponse;
}

export interface cache {
  timestamp: number;
  rates: fetchRatesResponse | null;
}

export interface findManyTransaction extends findMany {
  userId?: string[];
  type?: transactionType;
  status?: transactionStatus;
  reference?: string[];
  recipientId?: string[];
  amount?: number[];
}

export interface findOneTransaction extends findOne {
  userId?: string;
  type?: transactionType;
  status?: transactionStatus;
  reference?: string;
  amount?: number;
}
