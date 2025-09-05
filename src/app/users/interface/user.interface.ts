import { findMany, findOne } from '@app/common';
import { Roles } from './roles.interface';

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
  roleLevel: number;
  roles: Roles;
  refercode?: string;
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
}

export interface findOneUser extends findOne {
  fullName?: string;
  email?: string;
  refercode?: string;
}

export interface createUser
  extends Pick<IUser, 'email' | 'fullName' | 'role' | 'roleLevel' | 'type'> {
  roles?: Roles;
}
