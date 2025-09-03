import { IUser } from '@app/users/interface';

export interface FollowTrader {
  id: string;
  followerId: string; //who is following
  followingId: string; //who you are following
  createdAt: Date;
  updatedAt: Date;
  follower?: IUser;
  following?: IUser;
}

export type createFollower = Pick<FollowTrader, 'followingId'>;
export type Period = 'daily' | '7D' | '30D' | '90D';
export type DrawdownPoint = { date: string; drawdown: number };
export type PerfPoint = { date: string; cumulative: number };

export interface profilePerformance {
  period: Period;
  userId: string;
}

export interface curve {
  period: number;
  userId: string;
}
