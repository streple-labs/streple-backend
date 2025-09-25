import { IUser } from '@app/users/interface';
import { SubscriptionPlan, SubscriptionStatus } from './subscription.interface';

export interface ISubscriptionHistory {
  id?: string;
  user: IUser;
  userId: string;
  subscriptionId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: number;
  changeReason: string;
  metadata: Record<string, any>;
  createdAt?: Date;
}
