import { findMany, findOne } from '@app/common';
import { IUser } from '@app/users/interface';

export enum ReferralLevel {
  LEVEL_1 = 'Level 1',
  LEVEL_2 = 'Level 2',
}

export enum ReferralStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

export interface IReferral {
  id: string;
  directReferrerId: string;
  directReferrer: IUser;
  indirectReferrerId?: string;
  indirectReferrer?: IUser;
  userId: string;
  user: IUser;
  hasBadge: boolean;
  exclusive: boolean;
  level: ReferralLevel;
  amount: number;
  status: ReferralStatus;
  badgeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReferralRewardSetting {
  id: string;
  level: ReferralLevel;
  amount: number;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

export type createReward = Pick<
  IReferralRewardSetting,
  'amount' | 'level' | 'count'
>;
export type createReferral = Partial<
  Pick<IReferral, 'directReferrerId' | 'userId'>
>;

export type updatedReward = Partial<createReward>;

export interface ReferralHistory {
  userId: string;
  directReferrerId: string;
  indirectReferrerId: string | undefined;
  level: ReferralLevel;
  amount: number;
  status: ReferralStatus;
  hasBadge: boolean;
  exclusive: boolean;
}

export interface findManyReferral extends findMany {
  level?: ReferralLevel;
  directReferrerId?: string[];
  indirectReferrerId?: string[];
  status?: ReferralStatus;
  hasBadge?: boolean;
  exclusive?: boolean;
}

export interface findOneReferral extends findOne {
  level?: ReferralLevel;
  directReferrerId?: string;
  indirectReferrerId?: string;
  status?: ReferralStatus;
  hasBadge?: boolean;
  exclusive?: boolean;
}

export interface findManyReward extends findMany {
  level?: ReferralLevel;
}
