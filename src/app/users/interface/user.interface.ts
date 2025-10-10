import { findMany, findOne } from '@app/common';
import { Roles } from './roles.interface';
import { IWallets } from '@app/wallets/input';

export enum Role {
  follower = 'FOLLOWER',
  pro = 'PRO_TRADER',
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
  username: string;
  email: string;
  password: string;
  isVerified: boolean;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  role?: Role;
  bio?: string;
  auth_type: authType;
  type: userType;
  avatarUrl?: string;
  howFamiliarWithTrading?: string;
  expectationFromStreple?: string;
  hasAnswer: boolean;
  status: userStatus;
  gender: gender;
  isTfaEnabled?: boolean;
  tfaSecret?: string;
  roleLevel: number;
  roles: Roles;
  wallets: IWallets[];
  refercode?: string;
  transactionPin?: string;
  hasTransactionPin: boolean;
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
  roleName?: string[];
  privilege?: string[];
  type?: string[];
  username?: string[];
}

export interface findOneUser extends findOne {
  fullName?: string;
  email?: string;
  refercode?: string;
  username?: string;
}

export interface createUser
  extends Pick<IUser, 'email' | 'fullName' | 'role' | 'roleLevel' | 'type'> {
  roles?: Roles;
}

export interface generate2FaPayload {
  uri: string;
  secret: string;
}

export interface initiateTfaEnabling {
  secret: string;
  email: string;
}

export interface ManageTfa {
  email: string;
  tfaToken: string;
}

export interface verifyTfaEnabling {
  secret: string;
  code: string;
}

export interface ctp {
  pin: string;
}

export interface changePin {
  oldPin: string;
  newPin: string;
}
