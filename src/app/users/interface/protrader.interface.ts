import { findMany, findOne } from '@app/common';

export interface IProTrader {
  id: string;
  name: string;
  email: string;
  tradingExperience: string;
  exchangesUsed: string;
  socialHandlers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type createProTrader = Omit<
  IProTrader,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface findManyProTrader extends findMany {
  name?: string[];
  email?: string[];
}

export interface findOneProTrader extends findOne {
  name?: string;
  email?: string;
}
