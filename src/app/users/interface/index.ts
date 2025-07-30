import { findMany, findOne } from '@app/common';
import { ICopyWallet } from '@app/copy-trading/interface';

export enum Role {
  pro = 'PRO_TRADER',
  follower = 'FOLLOWER',
  admin = 'ADMIN',
}

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  isVerified: boolean;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  role: Role;
  bio?: string;
  avatarUrl?: string;
  stats: Record<string, unknown>;
  performanceHistory: Array<{ date: Date; value: number }>;
  followerCount: number;
  demoFundingBalance: number;
  copyWallets: ICopyWallet[];
  createdAt: Date;
  updatedAt: Date;
}

export interface findManyUser extends findMany {
  fullName?: string[];
  email?: string[];
  isVerified?: boolean[];
}

export interface findOneUser extends findOne {
  fullName?: string;
  email?: string;
}
