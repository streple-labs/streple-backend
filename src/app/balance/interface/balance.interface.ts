import { IUser } from '@app/users/interface';

export enum BalanceStatus {
  active = 'Active',
  locked = 'Locked',
  promo = 'Promo',
}

export enum BalanceMode {
  demo = 'Demo',
  real = 'Real',
}

export enum BalanceType {
  funding = 'Funding',
  trading = 'Trading',
}

export enum Source {
  gamified = 'Gamified',
  referral = 'Referral',
  internal = 'Internal Transfer',
  sub = 'Subscription',
}

export enum TransactionType {
  deposit = 'Deposit',
  withdraw = 'Withdraw',
  transfer = 'Transfer',
}

export enum TransactionStatus {
  successful = 'Successful',
  pending = 'Pending',
  fail = 'Failed',
}

export interface IBalance {
  id: string;
  user: IUser;
  type: BalanceType;
  mode: BalanceMode;
  status: BalanceStatus;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  id: string;
  user: IUser;
  type: BalanceType;
  mode: BalanceMode;
  source: Source;
  amount: number;
  transactionType: TransactionType;
  description: string;
  status: TransactionStatus;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}
