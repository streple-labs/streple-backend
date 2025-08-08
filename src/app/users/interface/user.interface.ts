import { findMany, findOne } from '@app/common';
import { ICopyWallet } from '@app/copy-trading/interface';

export enum Role {
  pro = 'PRO_TRADER',
  follower = 'FOLLOWER',
  superAdmin = 'SUPER_ADMIN',
  publish = 'PUBLISHER',
  admin = 'ADMIN',
  marketer = 'MARKETER',
}

export enum userStatus {
  active = 'ACTIVE',
  inactive = 'INACTIVE',
}

export enum gender {
  male = 'MALE',
  female = 'FEMALE',
  others = 'OTHERS',
}

export enum authType {
  oath = 'OAUTH',
  email = 'EMAIL',
}

export enum userType {
  internal = 'Internal',
  external = 'External',
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
  auth_type: authType;
  type: userType;
  avatarUrl?: string;
  stats: Record<string, unknown>;
  performanceHistory: Array<{ date: Date; value: number }>;
  followerCount: number;
  demoFundingBalance: number;
  howFamiliarWithTrading?: string;
  expectationFromStreple?: string;
  hasAnswer: boolean;
  copyWallets: ICopyWallet[];
  status: userStatus;
  gender: gender;
  roleLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export type updateProfile = Partial<
  Omit<
    IUser,
    | 'stats'
    | 'performanceHistory'
    | 'followerCount'
    | 'demoFundingBalance'
    | 'copyWallets'
  >
>;

export interface findManyUser extends findMany {
  fullName?: string[];
  email?: string[];
  isVerified?: boolean[];
}

export interface findOneUser extends findOne {
  fullName?: string;
  email?: string;
}

export type createUser = Pick<IUser, 'email' | 'fullName' | 'role'>;
