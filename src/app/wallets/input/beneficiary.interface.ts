import { findMany, findOne } from '@app/common';
import { IUser } from '@app/users/interface';

export interface IBeneficiary {
  id: string;
  bankName?: string;
  bankCode?: number;
  accountName?: string;
  accountNumber?: number;
  bankAvatar?: string;
  internal: boolean;
  userId: string;
  recipient?: IUser;
  user: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export type saveBeneficiary = Omit<
  IBeneficiary,
  'id' | 'user' | 'createdAt' | 'updatedAt'
>;

export interface findManyBeneficiary extends findMany {
  bankName?: string[];
  accountNumber?: number[];
  accountName?: string[];
  fullName?: string[];
  username?: string[];
  userId?: string[];
  internal?: boolean;
}

export interface findOneBeneficiary extends findOne {
  bankName?: string;
  accountNumber?: number;
  accountName?: string;
  userId?: string;
}
