/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuthUser, Document, DocumentResult } from '@app/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
  getAggregateValue,
} from '@app/helpers';
import {
  HttpClientService,
  TradeJobWorker,
  WebSocketService,
} from '@app/services';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Big from 'big.js';
import { Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Trades } from './entities/trader.entity';
import {
  action,
  copiers,
  copyTrade,
  createTrade,
  duration,
  executeTrade,
  findManyTrade,
  findOneTrade,
  ITrades,
  orderType,
  outcome,
  riskLevel,
  status,
  tokenPrice,
  tokenPriceResponse,
  TradingStats,
  type,
  updateParameter,
  updateTrade,
} from './input';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trades) private readonly tradeRepo: Repository<Trades>,
    @Inject(forwardRef(() => TradeJobWorker))
    private readonly tradeJW: TradeJobWorker,
    @Inject(forwardRef(() => HttpClientService))
    private readonly httpClient: HttpClientService,
    @Inject(forwardRef(() => WebSocketService))
    private readonly wsGateway: WebSocketService,
    private readonly configService: ConfigService,
  ) {}

  async create(create: createTrade, user: AuthUser): Promise<Trades> {
    // Check for duplicate trade with same symbol and open status for this user
    const duplicate = await this.tradeRepo.findOne({
      where: {
        asset: create.asset,
        creatorId: user.id,
        action: create.action,
        status: Not(status.close),
      },
    });

    if (duplicate) {
      throw new ForbiddenException(
        `You already have an ${duplicate.status} trade for this symbol`,
      );
    }
    const now = new Date();
    const symbol = create.asset.split('/')[0].toLowerCase();
    const identifier = `${symbol}_${uuidv4()}`;
    const userId = user.id;
    const creatorId = user.id;

    // get the current price from the internet
    const info = await this.fetchPrice({
      vs_currency: 'usd',
      symbols: symbol,
    });

    const image = info[0]?.image || '';
    const currentPrice = info[0]?.current_price ?? 0;

    // calculate the margin required using the following formular
    // leverage ratio: 1x,5x,10
    // position size: total value of the trade
    // marginRequired: capital user must have to open the trade
    // formula marginRequired = positionSize / leverageRatio
    create.entryPrice = create.entryPrice ?? currentPrice;
    const margin = Big(create.positionSize.amount)
      .times(Big(create.entryPrice))
      .div(Big(create.leverage))
      .toNumber();

    // TODO check if user have upto marginRequired in his/her trading fund
    // TODO return insufficient fund if the marginRequired is not less or equal the fund user have

    const DURATION_MAP = {
      [duration.scalp]: 5 * 60 * 1000,
      [duration.intraday]: 24 * 60 * 60 * 1000,
      [duration.swing]: 7 * 24 * 60 * 60 * 1000,
      [duration.position]: 30 * 24 * 60 * 60 * 1000,
    };

    if (create.duration === duration.custom) {
      if (!create.startDate || !create.endDate) {
        throw new ForbiddenException(
          'Custom trade duration must provide startDate and endDate',
        );
      }
      create.startDate = new Date(create.startDate);
      create.expiresAt = new Date(create.endDate);

      const delayStart = create.startDate.getTime() - Date.now();
      const delayEnd = create.expiresAt.getTime() - Date.now();

      create.scheduleStartId = this.tradeJW.scheduleTrade(
        { identifier, type: 'starting' },
        delayStart,
      );

      create.scheduleEndId = this.tradeJW.scheduleTrade(
        { identifier, type: 'expiring' },
        delayEnd,
      );
    } else {
      const ms = DURATION_MAP[create.duration];
      create.startDate = now;
      create.expiresAt = new Date(now.getTime() + ms);

      const delayEnd = create.expiresAt.getTime() - Date.now();
      create.scheduleEndId = this.tradeJW.scheduleTrade(
        { identifier, type: 'expiring' },
        delayEnd,
      );
    }

    let tradeStatus: status;
    if (create.isDraft) {
      tradeStatus = status.draft;
    } else if (create.duration === duration.custom && create.startDate > now) {
      tradeStatus = status.schedule;
    } else {
      const isOpen = this.executeTrade({
        action: create.action,
        currentPrice,
        entryPrice: create.entryPrice,
        orderType: create.orderType,
      });
      tradeStatus = isOpen ? status.open : status.pending;
    }

    const riskLevel = this.calculateRisk(create.leverage);

    const { endDate, ...rest } = create;
    const save = this.tradeRepo.create({
      ...rest,
      identifier,
      symbol,
      tradeType: type.original,
      image,
      currentPrice,
      status: tradeStatus,
      userId,
      creatorId,
      riskLevel,
      margin,
    });

    const newTrade = await this.tradeRepo.save(save);
    // broadcast to users on the pages
    this.wsGateway.broadcast('newTrade', newTrade);
    return newTrade;
  }

  async copyTrade(dto: copyTrade, user: AuthUser): Promise<Trades> {
    // find trade
    const trade = await this.tradeRepo.findOne({ where: { id: dto.tradeId } });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Check if user already copied this trade (by identifier)
    const isUserHaveSameTrade = await this.tradeRepo.findOne({
      where: { identifier: trade.identifier, userId: user.id },
    });

    if (isUserHaveSameTrade) {
      throw new ForbiddenException('Same trade already executed');
    }

    // TODO Get the trade margin and check the user balance
    // TODO if the user balance is greater than the margin allow copy else throw insufficient balance error

    // extract data
    const info = await this.fetchPrice({
      vs_currency: 'usd',
      symbols: trade.symbol,
    });

    const currentPrice = info[0]?.current_price ?? 0;

    return this.tradeRepo.manager.transaction(async (manager) => {
      // Lock the original trade row for update
      const lockedTrade = await manager.findOne(Trades, {
        where: { id: trade.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedTrade) throw new NotFoundException('Trade not found');

      if (trade.status === status.pending) {
        const isOpen = this.executeTrade({
          action: lockedTrade.action,
          currentPrice,
          entryPrice: lockedTrade.entryPrice,
          orderType: lockedTrade.orderType,
        });
        lockedTrade.status = isOpen ? status.open : status.pending;
      }

      lockedTrade.noOfCopiers = Big(trade.noOfCopiers).plus(Big(1)).toNumber();
      const { id, userId, tradeType, ...rest } = lockedTrade;

      const save = manager.create(Trades, {
        ...rest,
        userId: user.id,
        currentPrice,
        tradeType: type.copy,
      });

      const newTrade = await manager.save(save);
      await manager.update(
        Trades,
        { identifier: lockedTrade.identifier },
        {
          currentPrice,
          noOfCopiers: lockedTrade.noOfCopiers,
          status: lockedTrade.status,
        },
      );

      return newTrade;
    });
  }

  async cancelTrade(tradeId: string, user: AuthUser): Promise<ITrades> {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId, userId: user.id, status: Not(status.close) },
    });
    if (!trade) {
      throw new ForbiddenException('Trade not exist or Trade already close');
    }

    // extract data
    const info = await this.fetchPrice({
      vs_currency: 'usd',
      symbols: trade.symbol,
    });

    const currentPrice = info[0]?.current_price ?? 0;

    const { realizedPnL, outcome, tradeRoi } = this.calculateTradeResults(
      trade,
      currentPrice,
    );

    trade.status = status.close;
    trade.exitPrice = currentPrice;
    trade.realizedPnl = realizedPnL;
    trade.outcome = outcome;
    trade.tradeRoi = tradeRoi;

    // TODO fund the user balance
    return this.tradeRepo.save(trade);
  }

  async getTokenNames() {
    const { data } = await this.httpClient.fetchData(
      'https://api.coingecko.com/api/v3/coins/list',
    );
    return data;
  }

  async fetchPrice(data: tokenPrice): Promise<tokenPriceResponse[]> {
    // https://api.coingecko.com/api/v3/simple/price
    const params = this.toUrlParams(data);
    const url = `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`;
    const options = {
      accept: 'application/json',
      'x-cg-demo-api-key': this.configService.get('COINGECKO_DEMO_API_KEY'),
    };
    const { data: response } = await this.httpClient.fetchData<
      tokenPriceResponse[]
    >(url, options);
    return response;
  }

  async findAll(query: findManyTrade): Promise<DocumentResult<Trades>> {
    const qb = this.tradeRepo.createQueryBuilder('trade');
    buildFindManyQuery(
      qb,
      'trade',
      this.filter(query),
      query.search,
      ['asset', 'symbol'],
      query.include,
      query.sort,
    );

    if (query.copiers === copiers.least) {
      const minCopiers = await getAggregateValue(
        qb.connection,
        'trades',
        'noOfCopiers',
        'MIN',
      );
      qb.andWhere('trade."noOfCopiers" = :minCopiers', { minCopiers });
    }

    if (query.copiers === copiers.most) {
      const maxCopiers = await getAggregateValue(
        qb.connection,
        'trades',
        'noOfCopiers',
        'MAX',
      );
      qb.andWhere('trade."noOfCopiers" = :maxCopiers', { maxCopiers });
    }

    return FindManyWrapper(qb, query.page, query.limit).then((data) => {
      data.data = data.data.map((item) => ({
        ...item,
        copiersProfit: item.getTotalProfitForCopies(),
      })) as any[];
      return data;
    });
  }

  async findAllOpenTrade() {
    const qb = this.tradeRepo
      .createQueryBuilder('trade')
      .select([
        'trade.identifier',
        'trade.symbol',
        'entryMarket',
        'stopLoss',
        'takeProfit',
      ])
      .addSelect('COUNT(trade.id)', 'count')
      .where('trade.status = :status', { status: status.open })
      .groupBy('trade.identifier')
      .addGroupBy('trade.symbol')
      .addGroupBy('trade.entryMarket')
      .addGroupBy('trade.stopLoss')
      .addGroupBy('trade.takeProfit');

    const results = await qb.getRawMany();

    return results.map((row) => ({
      identifier: row.trade_identifier,
      symbol: row.trade_symbol,
      entryMarket: row.trade_entryMarket,
      stopLoss: row.trade_stopLoss,
      takeProfit: row.trade_takeProfile,
      count: Number(row.count),
    }));
  }

  async findOne(query: findOneTrade): Promise<Document<Trades>> {
    const { include, sort, ...filters } = query;
    return FindOneWrapper<Trades>(this.tradeRepo, {
      include,
      sort,
      filters,
    }).then((data) => {
      if (data) {
        (data.data as any).copiesProfit = data.data?.getTotalProfitForCopies();
      }
      return data;
    });
  }

  async getTradingStats(userId: string): Promise<TradingStats> {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Base query for 90 days
    const baseQuery = this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.creatorId = :userId', { userId });

    // Get open trades count
    const openTrades = await baseQuery
      .clone()
      .andWhere('trade.status IN (:...openStatuses)', {
        openStatuses: [status.pending, status.open],
      })
      .getCount();

    // Get closed trades count
    const closedTrades = await baseQuery
      .clone()
      .andWhere('trade.status = :closedStatus', {
        closedStatus: status.close,
      })
      .andWhere('trade.createdAt >= :ninetyDaysAgo', { ninetyDaysAgo })
      .getCount();

    // Get all trades for calculations
    const allTrades = await baseQuery.clone().getMany();

    // Calculate total PnL
    const totalPnL = allTrades.reduce((sum, trade) => {
      return sum + parseFloat(trade.realizedPnl.toString());
    }, 0);

    // Calculate win rate
    const completedTrades = allTrades.filter(
      (trade) => trade.outcome && trade.status === status.close,
    );
    const winningTrades = completedTrades.filter(
      (trade) => trade.outcome === outcome.win,
    );
    const winRate =
      completedTrades.length > 0
        ? (winningTrades.length / completedTrades.length) * 100
        : 0;

    // Calculate average ROI
    const averageROI =
      allTrades.length > 0
        ? allTrades.reduce((sum, trade) => sum + trade.tradeRoi, 0) /
          allTrades.length
        : 0;

    // Calculate total profit (only positive PnL)
    const totalProfit = allTrades.reduce((sum, trade) => {
      const pnl = parseFloat(trade.realizedPnl.toString());
      return pnl > 0 ? sum + pnl : sum;
    }, 0);

    // Get profit trend (last 30 days vs previous 30 days)
    const last30DaysTrades = await this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.creatorId = :userId', { userId })
      .andWhere('trade.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('trade.status = :closedStatus', { closedStatus: status.close })
      .getMany();

    const previous30DaysTrades = await this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.creatorId = :userId', { userId })
      .andWhere('trade.createdAt >= :sixtyDaysAgo', { sixtyDaysAgo })
      .andWhere('trade.createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('trade.status = :closedStatus', { closedStatus: status.close })
      .getMany();

    const current30DaysProfit = last30DaysTrades.reduce((sum, trade) => {
      const pnl = parseFloat(trade.realizedPnl.toString());
      return pnl > 0 ? sum + pnl : sum;
    }, 0);

    const previous30DaysProfit = previous30DaysTrades.reduce((sum, trade) => {
      const pnl = parseFloat(trade.realizedPnl.toString());
      return pnl > 0 ? sum + pnl : sum;
    }, 0);

    const percentageChange =
      previous30DaysProfit > 0
        ? ((current30DaysProfit - previous30DaysProfit) /
            previous30DaysProfit) *
          100
        : current30DaysProfit > 0
          ? 100
          : 0;

    // Get number of followers (unique users who copied trades)

    // Get risk level trends
    const results = await this.tradeRepo
      .createQueryBuilder('trade')
      .select('trade.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .groupBy('trade.riskLevel')
      .orderBy('count', 'DESC')
      .getRawMany();

    let treadingRisk: riskLevel;
    if (results.length === 0) treadingRisk = riskLevel.low;
    treadingRisk = results[0].riskLevel;

    return {
      activeTrade: openTrades,
      closedTrade: closedTrades,
      totalPnL,
      winRate: Math.round(winRate * 100) / 100,
      averageROI: Math.round(averageROI * 10000) / 10000,
      currentProfit: totalProfit,
      profitChange: {
        amount: current30DaysProfit,
        percentage: Math.round(percentageChange * 100) / 100,
        isIncreased: percentageChange > 0,
      },
      followers: 0,
      riskLevelTrends: treadingRisk,
    };
  }

  async update(
    id: string,
    update: updateTrade,
    user: AuthUser,
  ): Promise<ITrades> {
    //first find the trader
    const trade = await this.tradeRepo.findOne({
      where: { id, creatorId: user.id },
    });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (trade.status === status.close) {
      throw new ForbiddenException('Unable to update trade close');
    }
    // check if the trade as not be copy by anybody
    const ableToEdit = await this.tradeRepo.find({
      where: { identifier: trade.identifier },
    });

    if (ableToEdit.length >= 2) {
      throw new ForbiddenException(
        'Unable to edit, Trade have been copy by followers',
      );
    }

    // check if trade is a draft before now
    await this.tradeRepo.update({ id }, { ...update });
    return { ...trade, ...update };
  }

  async remove(id: string, user: AuthUser) {
    //first find the trader
    const trade = await this.tradeRepo.findOne({
      where: { id, creatorId: user.id },
    });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (trade.status === status.close) {
      throw new ForbiddenException('Unable to update trade close');
    }
    // check if the trade as not be copy by anybody
    const ableToEdit = await this.tradeRepo.find({
      where: { identifier: trade.identifier },
    });

    if (ableToEdit.length >= 2) {
      throw new ForbiddenException(
        'Unable to delete, Trade have been copy by followers',
      );
    }

    // allow delete
    return this.tradeRepo.delete(id);
  }

  async systemUpdate(
    filter: updateParameter,
    type: 'starting' | 'expiring',
    updates: updateTrade,
  ): Promise<Trades | null> {
    const findTrades = await this.tradeRepo.find({
      where: { identifier: filter.identifier, status: Not(status.close) },
    });

    if (!findTrades.length) return null;

    const trade = findTrades[0];
    const info = await this.fetchPrice({
      vs_currency: 'usd',
      symbols: trade.symbol,
    });

    const currentPrice = info[0]?.current_price ?? 0;
    if (type === 'starting') {
      const isOpen = this.executeTrade({
        action: trade.action,
        currentPrice,
        entryPrice: trade.entryPrice ?? trade.currentPrice,
        orderType: trade.orderType,
      });
      const statusTrade = isOpen ? status.open : status.pending;

      updates.status = statusTrade;
      updates.currentPrice = currentPrice;

      await this.tradeRepo.update(
        { identifier: filter.identifier },
        { ...updates },
      );
      return trade;
    }

    if (type === 'expiring') {
      const { outcome, tradeRoi, realizedPnL } = this.calculateTradeResults(
        trade,
        currentPrice,
      );

      updates.status = status.close;
      updates.outcome = outcome;
      updates.realizedPnl = realizedPnL;
      updates.tradeRoi = tradeRoi;
      updates.exitPrice = currentPrice;

      await this.tradeRepo.update(
        { identifier: filter.identifier },
        { ...updates },
      );
      return trade;
    }
    return null;
  }

  private executeTrade(data: executeTrade) {
    if (data.orderType === orderType.limit) {
      if (
        data.action === action.buy &&
        Big(data.currentPrice).lte(Big(data.entryPrice))
      ) {
        return true;
      }
      if (
        data.action === action.sell &&
        Big(data.currentPrice).gte(Big(data.entryPrice))
      ) {
        return true;
      }
      return false;
    }
    return true;
  }

  private calculateRisk(leverage: number) {
    if (leverage <= 4) return riskLevel.low;
    if (leverage <= 9) return riskLevel.medium;
    return riskLevel.high;
  }

  private filter(query: findManyTrade) {
    const filter: Record<string, any> = {};

    if (query.creatorId) filter['creatorId'] = query.creatorId;
    if (query.status) filter['status'] = query.status;
    if (query.symbol) filter['symbol'] = query.symbol;
    if (query.userId) filter['userId'] = query.userId;
    if (query.type) filter['tradeType'] = { $eq: query.type };
    if (query.asset) filter['asset'] = query.asset;
    if (query.action) filter['action'] = query.action;
    if (query.outcome) filter['outcome'] = query.outcome;
    if (query.draft) filter['draft'] = { $eq: query.draft };
    if (query.fromDate && query.toDate) {
      filter['createdAt'] = { $between: [query.fromDate, query.toDate] };
    }

    return filter;
  }

  private calculateTradeResults(trade: ITrades, exitPrice: number) {
    let realizedPnL: number;
    if (trade.action === action.buy) {
      realizedPnL = Big(exitPrice)
        .sub(Big(trade.entryPrice))
        .times(trade.positionSize.amount)
        .toNumber();
    } else {
      realizedPnL = Big(trade.entryPrice)
        .sub(Big(exitPrice))
        .times(trade.positionSize.amount)
        .toNumber();
    }

    const roi = Big(realizedPnL)
      .div(Big(trade.margin))
      .times(Big(100))
      .toNumber();

    const tradeOutcome =
      realizedPnL > 0
        ? outcome.win
        : realizedPnL < 0
          ? outcome.loss
          : outcome.liq;

    return { realizedPnL, tradeRoi: roi, outcome: tradeOutcome };
  }

  private fundUsers(margin: number, realizedPnL: number) {
    const totalCredit = Big(margin).add(Big(realizedPnL)).toNumber();

    if (totalCredit <= 0) {
      return 0; // User lost entire margin (liquidation)
    } else {
      return totalCredit;
    }

    // usage
    // const toCredit = this.fundUsers(trade.margin, trade.realizedPnL);
    // user.balance += toCredit;
  }

  private toUrlParams(data: Record<string, any>): URLSearchParams {
    const searchParams = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else if (typeof value === 'boolean') {
        searchParams.append(key, String(value));
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
      // skip undefined/null
    });
    return searchParams;
  }
}
