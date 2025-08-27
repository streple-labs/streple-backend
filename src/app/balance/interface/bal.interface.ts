import { findMany, findOne } from '@app/common';
import {
  BalanceMode,
  BalanceType,
  ITransaction,
  TransactionStatus,
  TransactionType,
} from './balance.interface';

export interface newTransaction
  extends Omit<ITransaction, 'id' | 'createdAt' | 'updatedAt' | 'user'> {
  fromType?: BalanceType;
  toType?: BalanceType;
  idempotencyKey: string;
  skipBalanceUpdate?: boolean;
}

export interface userBalance {
  type?: BalanceType;
  mode: BalanceMode;
}

export interface findManyTransaction extends findMany {
  user?: string[];
  type?: BalanceType[];
  mode?: BalanceMode[];
  status?: TransactionStatus[];
  transactionType?: TransactionType[];
}

export interface findOneTransaction extends findOne {
  user?: string;
  type?: BalanceType;
  mode?: BalanceMode;
  status?: TransactionStatus;
  transactionType?: TransactionType;
}

export interface transfer {
  amount: string;
  fromAccount: BalanceType;
  toAccount: BalanceType;
  mode: BalanceMode;
}
