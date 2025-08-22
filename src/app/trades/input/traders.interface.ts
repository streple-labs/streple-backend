import { findMany, findOne } from '@app/common';
import { IUser } from '@app/users/interface';

export interface ITraders {
  id: string;
  follower: string; //the pro trader you are following
  following: string; //the user following pro trader
}

export enum direction {
  long = 'long',
  short = 'short',
}

export enum status {
  open = 'open',
  close = 'close',
  pending = 'pending',
}

export enum action {
  buy = 'buy',
  sell = 'sell',
}

export interface ITrades {
  id?: string;
  userId: string;
  user: IUser;
  creatorId: string;
  creator: IUser;
  symbol: string;
  entryMarket: number;
  riskLevel?: string;
  action: action;
  direction: direction;
  stopLoss: number;
  takeProfit: number;
  status: status;
  exitPrice?: number;
  stakeAmount?: number;
  identifier: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type createTrade = Pick<
  ITrades,
  | 'symbol'
  | 'direction'
  | 'stopLoss'
  | 'takeProfit'
  | 'stakeAmount'
  | 'entryMarket'
  | 'riskLevel'
  | 'action'
>;
export interface updateTrade extends Partial<createTrade> {
  status?: status;
}
export interface findManyTrade extends findMany {
  creatorId?: string[];
  userId?: string[];
  symbol?: string[];
  status?: status[];
}

export interface copyTrade {
  tradeId: string;
  stakeAmount: number;
}

export interface findOneTrade extends findOne {
  creatorId?: string;
  userId?: string;
  symbol?: string;
  status?: status;
}
