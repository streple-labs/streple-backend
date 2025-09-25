import { findMany, findOne } from '@app/common';
import { IUser } from '@app/users/interface';

export enum SubscriptionStatus {
  active = 'active',
  canceled = 'canceled',
  expired = 'expired',
  past_due = 'past_due',
}

export enum SubscriptionPlan {
  basic = 'basic',
  premium = 'premium',
  enterprise = 'enterprise',
}

export interface Subscriptions {
  id?: string;
  user: IUser;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: number;
  scheduleId?: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface createSub {
  idempotencyKey: string;
}

export interface findManySubscription extends findMany {
  userId?: string[];
  plan?: SubscriptionPlan[];
  status?: SubscriptionStatus[];
}

export interface findOneSubscription extends findOne {
  userId?: string;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
}
