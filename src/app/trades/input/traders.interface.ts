import { findMany, findOne } from '@app/common';
import { IUser } from '@app/users/interface';

export interface ITraders {
  id: string;
  follower: string; //the pro trader you are following
  following: string; //the user following pro trader
}

export enum status {
  open = 'open',
  close = 'close',
  pending = 'pending',
  schedule = 'scheduled',
  draft = 'draft',
}

export enum action {
  buy = 'buy',
  sell = 'sell',
}

export enum type {
  original = 'original',
  copy = 'copy',
}

export enum outcome {
  win = 'Win',
  loss = 'Loss',
  liq = 'Liquidated',
}

export interface positionSize {
  amount: number;
  currency: 'USDT' | 'BTC';
}

export enum duration {
  scalp = 'Scalp',
  intraday = 'Intraday',
  swing = 'Swing',
  position = 'Position',
  custom = 'custom',
}

export enum riskLevel {
  low = 'Low',
  medium = 'Medium',
  high = 'High',
}

export enum orderType {
  market = 'Market Order',
  limit = 'Limit Order',
}

export interface ITrades {
  id: string;
  asset: string;
  action: action;
  symbol: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  leverage: number;
  isDraft: boolean;
  outcome?: outcome;
  tradeRoi: number;
  userId: string;
  user: IUser;
  creatorId: string;
  creator: IUser;
  currentPrice: number; //make api call when creating new trade to get the current price using the symbol
  positionSize: positionSize;
  realizedPnl: number; //the amount of profit take or lose in percentage update in realtime use subtract for lose and without minus sign for profit
  noOfCopiers: number; //once user copy the trade and save successful this will increase by one
  duration: duration;
  scheduleStartId?: number;
  scheduleEndId?: number;
  image?: string;
  startDate?: Date;
  orderType: orderType;
  expiresAt?: Date;
  riskLevel: riskLevel;
  comment?: string;
  exitPrice?: number;
  status: status;
  tradeType: type;
  margin: number;
  identifier: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface createTrade
  extends Pick<
    ITrades,
    | 'asset'
    | 'action'
    | 'entryPrice'
    | 'stopLoss'
    | 'takeProfit'
    | 'leverage'
    | 'positionSize'
    | 'duration'
    | 'orderType'
    | 'comment'
    | 'startDate'
    | 'isDraft'
  > {
  endDate: Date;
  expiresAt?: Date;
  scheduleStartId?: number;
  scheduleEndId?: number;
}
export type updateTrade = Partial<Omit<ITrades, 'creator' | 'user'>>;
export interface findManyTrade extends findMany {
  creatorId?: string[];
  userId?: string[];
  symbol?: string[];
  status?: status[];
  type?: type;
  draft?: boolean;
}

export interface updateParameter {
  identifier: string;
  id?: string;
}
export interface copyTrade {
  tradeId: string;
}

export interface findOneTrade extends findOne {
  creatorId?: string;
  userId?: string;
  symbol?: string;
  status?: status;
  draft?: boolean;
}

export interface executeTrade {
  action: action;
  orderType: orderType;
  currentPrice: number;
  entryPrice: number;
}

export interface TradingStats {
  activeTrade: number;
  closedTrade: number;
  totalPnL: number;
  winRate: number;
  averageROI: number;
  currentProfit: number;
  profitChange: {
    amount: number;
    percentage: number;
    isIncreased: boolean;
    // trend: 'increase' | 'decrease' | 'no_change';
  };
  followers: number;
  riskLevelTrends: string;
  // riskLevelTrends: {
  //   low: number;
  //   medium: number;
  //   high: number;
  // };
}

// export enum Currency {
//   btc = 'btc',
//   eth = 'eth',
//   ltc = 'ltc',
//   bch = 'bch',
//   bnb = 'bnb',
//   eos = 'eos',
//   xrp = 'xrp',
//   xlm = 'xlm',
//   link = 'link',
//   dot = 'dot',
//   yfi = 'yfi',
//   sol = 'sol',
//   usd = 'usd',
//   aed = 'aed',
//   ars = 'ars',
//   aud = 'aud',
//   bdt = 'bdt',
//   bhd = 'bhd',
//   bmd = 'bmd',
//   brl = 'brl',
//   cad = 'cad',
//   chf = 'chf',
//   clp = 'clp',
//   cny = 'cny',
//   czk = 'czk',
//   dkk = 'dkk',
//   eur = 'eur',
//   gbp = 'gbp',
//   gel = 'gel',
//   hkd = 'hkd',
//   huf = 'huf',
//   idr = 'idr',
//   ils = 'ils',
//   inr = 'inr',
//   jpy = 'jpy',
//   krw = 'krw',
//   kwd = 'kwd',
//   lkr = 'lkr',
//   mmk = 'mmk',
//   mxn = 'mxn',
//   myr = 'myr',
//   ngn = 'ngn',
//   nok = 'nok',
//   nzd = 'nzd',
//   php = 'php',
//   pkr = 'pkr',
//   pln = 'pln',
//   rub = 'rub',
//   sar = 'sar',
//   sek = 'sek',
//   sgd = 'sgd',
//   thb = 'thb',
//   try = 'try',
//   twd = 'twd',
//   uah = 'uah',
//   vef = 'vef',
//   vnd = 'vnd',
//   zar = 'zar',
//   xdr = 'xdr',
//   xag = 'xag',
//   xau = 'xau',
//   bits = 'bits',
//   sats = 'sats',
// }

export type Currency =
  | 'btc'
  | 'eth'
  | 'ltc'
  | 'bch'
  | 'bnb'
  | 'eos'
  | 'xrp'
  | 'xlm'
  | 'link'
  | 'dot'
  | 'yfi'
  | 'sol'
  | 'usd'
  | 'aed'
  | 'ars'
  | 'aud'
  | 'bdt'
  | 'bhd'
  | 'bmd'
  | 'brl'
  | 'cad'
  | 'chf'
  | 'clp'
  | 'cny'
  | 'czk'
  | 'dkk'
  | 'eur'
  | 'gbp'
  | 'gel'
  | 'hkd'
  | 'huf'
  | 'idr'
  | 'ils'
  | 'inr'
  | 'jpy'
  | 'krw'
  | 'kwd'
  | 'lkr'
  | 'mmk'
  | 'mxn'
  | 'myr'
  | 'ngn'
  | 'nok'
  | 'nzd'
  | 'php'
  | 'pkr'
  | 'pln'
  | 'rub'
  | 'sar'
  | 'sek'
  | 'sgd'
  | 'thb'
  | 'try'
  | 'twd'
  | 'uah'
  | 'vef'
  | 'vnd'
  | 'zar'
  | 'xdr'
  | 'xag'
  | 'xau'
  | 'bits'
  | 'sats';

export interface tokenPrice {
  vs_currencies?: Currency;
  vs_currency?: Currency;
  ids?: string | string[];
  names?: string | string[];
  symbols?: string | string[];
  category?: string;
  order?: string;
  per_page?: number;
  page?: number;
  sparkline?: boolean;
  price_change_percentage?: string;
  locale?: string;
  include_tokens?: 'all' | 'top';
  include_market_cap?: boolean;
  include_24hr_vol?: boolean;
  include_24hr_change?: boolean;
  include_last_updated_at?: boolean;
  precision?: 'all' | number;
}

export interface tokenPriceResponse {
  usd: number;
  usd_market_cap: number;
  usd_24h_vol: number;
  usd_24h_change: number;
  last_updated_at: number;
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: string | null;
  last_updated: string;
}
