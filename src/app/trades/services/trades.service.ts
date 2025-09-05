/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuthUser, Document, DocumentResult } from '@app/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
  getAggregateValue,
} from '@app/helpers';
import { HttpClientService, TradeJobWorker } from '@app/services';
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
import { In, Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FollowTraders } from '../entities';
import { Trades } from '../entities/trader.entity';
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
} from '../input';
import { PriceCache } from '../price-caches';
import { ActivityService } from './trade.community.service';

@Injectable()
export class TradesService {
  private canQuery: boolean = true;
  constructor(
    @InjectRepository(Trades) private readonly tradeRepo: Repository<Trades>,
    @InjectRepository(FollowTraders)
    private readonly follower: Repository<FollowTraders>,
    @Inject(forwardRef(() => TradeJobWorker))
    private readonly tradeJW: TradeJobWorker,
    @Inject(forwardRef(() => HttpClientService))
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService,
    private readonly priceCache: PriceCache,
    private readonly activityFeed: ActivityService,
  ) {}

  async create(create: createTrade, user: AuthUser): Promise<Trades> {
    // Check for duplicate trade with same symbol and open status for this user
    const duplicate = await this.tradeRepo.findOne({
      where: {
        asset: create.asset,
        creatorId: user.id,
        action: create.action,
        status: Not(In([status.close, status.draft])),
      },
    });

    if (duplicate) {
      throw new ForbiddenException(
        `You already have an ${duplicate.status} trade for this symbol`,
      );
    }
    const now = new Date();
    const symbol = create.asset.split('/')[0].toLowerCase();
    const currentPrice = this.currentPrice(create.asset);
    const identifier = `${symbol}_${uuidv4()}`;
    const userId = user.id;
    const creatorId = user.id;

    // calculate the margin required using the following formular
    // leverage ratio: 1x,5x,10
    // position size: total value of the trade
    // marginRequired: capital user must have to open the trade
    // formula marginRequired = positionSize / leverageRatio
    create.entryPrice = create.entryPrice ?? currentPrice;
    const margin =
      create.positionSize.amount > 0
        ? Big(create.positionSize.amount)
            .times(Big(create.entryPrice))
            .div(Big(create.leverage))
            .toNumber()
        : 0;

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

      if (!create.isDraft) {
        create.scheduleStartId = this.tradeJW.scheduleTrade(
          { identifier, type: 'starting' },
          delayStart,
        );

        create.scheduleEndId = this.tradeJW.scheduleTrade(
          { identifier, type: 'expiring' },
          delayEnd,
        );
      }
    } else {
      const ms = DURATION_MAP[create.duration];
      create.startDate = now;
      create.expiresAt = new Date(now.getTime() + ms);

      const delayEnd = create.expiresAt.getTime() - Date.now();
      if (!create.isDraft) {
        create.scheduleEndId = this.tradeJW.scheduleTrade(
          { identifier, type: 'expiring' },
          delayEnd,
        );
      }
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
    this.canQuery = true;
    const riskLevel = this.calculateRisk(create.leverage);

    const { endDate, ...rest } = create;
    const save = this.tradeRepo.create({
      ...rest,
      identifier,
      symbol,
      tradeType: type.original,
      currentPrice,
      status: tradeStatus,
      userId,
      creatorId,
      riskLevel,
      margin,
    });

    const newTrade = await this.tradeRepo.save(save);
    // broadcast to users on the pages
    if (!create.isDraft) {
      this.tradeJW.scheduleCopyTrade({
        tradeId: newTrade.id,
        creatorId: user.id,
      });
    }
    void this.activityFeed.create({
      title: `Trade ${create.isDraft ? 'Drafted' : 'Published'} `,
      message: `${create.asset} trade ${create.isDraft ? 'Drafted' : 'Published'} - Entry: ${create.entryPrice.toLocaleString()} | SL: ${create.stopLoss.toLocaleString()} | PT: ${create.takeProfit.toLocaleString()}`,
      userId: user.id,
    });

    return newTrade;
  }

  async cancelTrade(tradeId: string, user: AuthUser): Promise<ITrades> {
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId, userId: user.id, status: Not(status.close) },
    });
    if (!trade) {
      throw new ForbiddenException('Trade not exist or Trade already close');
    }

    const currentPrice = this.currentPrice(trade.asset);

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
    void this.activityFeed.create({
      title: 'Trade Closed',
      message: `${trade.asset} trade closed at: ${trade.exitPrice.toLocaleString()} - ${trade.realizedPnl}% P&L`,
      userId: user.id,
    });
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

  async checkTradingConditions(currentPrices: Record<string, number>) {
    if (this.canQuery) {
      const data = await this.findAllOpenTrade();
      if (!data.length) return (this.canQuery = false);

      data.forEach((user) => {
        if (user.status === status.pending) {
          void this.systemUpdate(
            { identifier: user.identifier },
            'starting',
            {},
          );
        }

        const currentPrice = this.currentPrice(user.asset);

        // For BUY orders
        if (user.action === action.buy) {
          // Close if TP hit or SL hit
          if (
            Big(currentPrice).gte(Big(user.takeProfit)) ||
            Big(currentPrice).lte(Big(user.stopLoss))
          ) {
            void this.systemUpdate(
              { identifier: user.identifier },
              'expiring',
              {
                status: status.close,
              },
            );
            this.tradeJW.closeJob(user.endingId);
            return;
          }
        }

        // For SELL orders
        if (user.action === action.sell) {
          if (
            Big(currentPrice).lte(Big(user.takeProfit)) ||
            Big(currentPrice).gte(Big(user.stopLoss))
          ) {
            void this.systemUpdate(
              { identifier: user.identifier },
              'expiring',
              {
                status: status.close,
              },
            );
            this.tradeJW.closeJob(user.endingId);
            return;
          }
        }

        // Only update open status if still open
        void this.systemUpdate({ identifier: user.identifier }, 'expiring', {
          status: status.open,
        });
      });
    }
  }

  async findOne(query: findOneTrade): Promise<Document<Trades>> {
    const { include, sort, ...filters } = query;
    // TODO risk ratio/reward
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

    // Base query
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

    const followers = await this.follower.find({
      where: { followingId: userId },
    });

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
      followers: followers.length,
      riskLevelTrends: treadingRisk,
    };
  }

  async update(
    id: string,
    update: updateTrade,
    user: AuthUser,
  ): Promise<ITrades | null> {
    //first find the trader
    const trade = await this.tradeRepo.findOne({
      where: { id, creatorId: user.id, status: Not(status.close) },
    });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // check if the trade as not be copy by anybody
    const ableToEdit = await this.tradeRepo.find({
      where: { identifier: trade.identifier },
    });

    if (ableToEdit.length >= 2) {
      throw new ForbiddenException(
        'Trade cannot be edited after it has been copied by followers',
      );
    }
    const now = new Date();
    const symbol = update.asset ?? trade.asset;
    const DURATION_MAP = {
      [duration.scalp]: 5 * 60 * 1000,
      [duration.intraday]: 24 * 60 * 60 * 1000,
      [duration.swing]: 7 * 24 * 60 * 60 * 1000,
      [duration.position]: 30 * 24 * 60 * 60 * 1000,
    };

    // const info = await this.fetchPrice({
    //   vs_currency: 'usd',
    //   symbols: symbol,
    // });

    const currentPrice = this.currentPrice(symbol);
    let tradeStatus: status = status.draft;
    // check if trade is a draft before now
    if (!update.isDraft && trade.isDraft) {
      if (update.duration === duration.custom) {
        if (!update.startDate || !update.endDate) {
          throw new ForbiddenException(
            'Custom trade duration must provide startDate and endDate',
          );
        }
        update.startDate = new Date(update.startDate);
        update.expiresAt = new Date(update.endDate);

        const delayStart = update.startDate.getTime() - Date.now();
        const delayEnd = update.expiresAt.getTime() - Date.now();

        update.scheduleStartId = this.tradeJW.scheduleTrade(
          { identifier: trade.identifier, type: 'starting' },
          delayStart,
        );

        update.scheduleEndId = this.tradeJW.scheduleTrade(
          { identifier: trade.identifier, type: 'expiring' },
          delayEnd,
        );
      } else {
        type DurationKey = keyof typeof DURATION_MAP;
        const duration = update.duration ?? trade.duration;
        const ms = DURATION_MAP[duration as DurationKey];
        update.startDate = now;
        update.expiresAt = new Date(now.getTime() + ms);

        const delayEnd = update.expiresAt.getTime() - Date.now();
        update.scheduleEndId = this.tradeJW.scheduleTrade(
          { identifier: trade.identifier, type: 'expiring' },
          delayEnd,
        );
      }

      if (update.isDraft) {
        tradeStatus = status.draft;
      } else if (
        update.duration === duration.custom &&
        update.startDate > now
      ) {
        tradeStatus = status.schedule;
      } else {
        const isOpen = this.executeTrade({
          action: update.action || trade.action,
          currentPrice,
          entryPrice: update.entryPrice || trade.entryPrice,
          orderType: update.orderType || trade.orderType,
        });
        tradeStatus = isOpen ? status.open : status.pending;
      }
    }
    void this.activityFeed.create({
      title: 'Trade Updated',
      message: `Modified ${trade.asset} trade - New Stop Loss: ${trade.stopLoss.toLocaleString()}`,
      userId: user.id,
    });
    await this.tradeRepo.update({ id }, { ...update, status: tradeStatus });
    if (!update.isDraft && trade.isDraft) {
      this.tradeJW.scheduleCopyTrade({
        tradeId: id,
        creatorId: trade.creatorId,
      });
    }
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
    return this.tradeRepo.manager.transaction(async (manager) => {
      const lockedTrade = await manager.find(Trades, {
        where: {
          identifier: filter.identifier,
          status: Not(status.close),
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedTrade.length) return null;
      const trade = lockedTrade[0];
      const currentPrice = this.currentPrice(trade.asset);

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

        await manager.update(
          Trades,
          { identifier: filter.identifier, status: Not(status.close) },
          { ...updates },
        );
        void this.activityFeed.create({
          title: 'Trade Updated',
          message: `${trade.asset} trade hit the market at: ${trade.entryPrice.toLocaleString()}`,
          userId: trade.creatorId,
        });
        return trade;
      }

      if (type === 'expiring') {
        const { outcome, tradeRoi, realizedPnL } = this.calculateTradeResults(
          trade,
          currentPrice,
        );

        updates.outcome = outcome;
        updates.realizedPnl = realizedPnL;
        updates.tradeRoi = tradeRoi;
        updates.exitPrice = currentPrice;

        await manager.update(
          Trades,
          { identifier: filter.identifier, status: Not(status.close) },
          { ...updates },
        );

        if (updates.status === status.close) {
          void this.activityFeed.create({
            title: 'Trade Closed',
            message: `${trade.asset} trade closed at: ${updates.exitPrice.toLocaleString()} - ${updates.realizedPnl}% P&L`,
            userId: trade.creatorId,
          });
        }
        return trade;
      }
      return null;
    });
  }

  async copyTradeBatch(dto: copyTrade) {
    const followers = await this.follower.find({
      where: { followingId: dto.creatorId },
      select: ['followerId'],
    });
    if (!followers.length) return { total: 0, copied: 0, skipped: 0 };

    const userIds = followers.map((f) => f.followerId);
    // Get the trade (skip if not available)
    const trade = await this.tradeRepo.findOne({
      where: { id: dto.tradeId, status: Not(In([status.close, status.draft])) },
    });
    if (!trade) {
      return { total: userIds.length, copied: 0, skipped: userIds.length };
    }

    // Get a set of users who already copied this trade
    const existingCopies = await this.tradeRepo.find({
      where: { identifier: trade.identifier, userId: In(userIds) },
      select: ['userId'],
    });
    const copiedUserIds = new Set(existingCopies.map((t) => t.userId));

    const usersToCopy = userIds.filter((uid) => !copiedUserIds.has(uid));

    // TODO Check if user have the margin required
    const tradesToInsert = usersToCopy.map((userId) => {
      const { user, creator, id, createdAt, updatedAt, ...rest } = trade;
      return {
        ...rest,
        userId,
        tradeType: type.copy,
      };
    });

    // const concurrency = 100;
    // const limit = pLimit(concurrency);
    // For *many thousands* (beyond 10k-100k) you may need to batch further (say, 1000 at a time), but for 100 or a few hundred, you’re absolutely within normal DB practice.
    if (tradesToInsert.length > 0) {
      await this.tradeRepo
        .createQueryBuilder()
        .insert()
        .into(Trades)
        .values(tradesToInsert)
        .orIgnore()
        .execute();
    }

    await this.tradeRepo.update(
      { identifier: trade.identifier },
      { noOfCopiers: () => `noOfCopiers + ${usersToCopy.length}` },
    );

    return {
      total: userIds.length,
      copied: usersToCopy.length,
      skipped: copiedUserIds.size,
    };
  }

  // async copyTrade(dto: copyTrade, user: AuthUser): Promise<Trades> {
  //   // TODO Get the trade margin and check the user balance
  //   // TODO if the user balance is greater than the margin allow copy else throw insufficient balance error
  //   return this.tradeRepo.manager.transaction(async (manager) => {
  //     // Lock the original trade row for update
  //     const lockedTrade = await manager.findOne(Trades, {
  //       where: { id: dto.tradeId, status: Not(status.close) },
  //       lock: { mode: 'pessimistic_write' },
  //     });

  //     if (!lockedTrade) throw new NotFoundException('Trade not found');

  //     // Check if user already copied this trade (by identifier)
  //     const isUserHaveSameTrade = await this.tradeRepo.findOne({
  //       where: { identifier: lockedTrade.identifier, userId: user.id },
  //     });

  //     if (isUserHaveSameTrade) {
  //       throw new ForbiddenException('Same trade already executed');
  //     }

  //     const currentPrice = this.currentPrice(lockedTrade.asset);
  //     if (lockedTrade.status === status.pending) {
  //       const isOpen = this.executeTrade({
  //         action: lockedTrade.action,
  //         currentPrice,
  //         entryPrice: lockedTrade.entryPrice,
  //         orderType: lockedTrade.orderType,
  //       });
  //       lockedTrade.status = isOpen ? status.open : status.pending;
  //     }

  //     lockedTrade.noOfCopiers = Big(lockedTrade.noOfCopiers)
  //       .plus(Big(1))
  //       .toNumber();
  //     const { id, userId, tradeType, ...rest } = lockedTrade;

  //     const save = manager.create(Trades, {
  //       ...rest,
  //       userId: user.id,
  //       currentPrice,
  //       tradeType: type.copy,
  //     });

  //     const newTrade = await manager.save(save);
  //     await manager.update(
  //       Trades,
  //       { identifier: lockedTrade.identifier },
  //       {
  //         currentPrice,
  //         noOfCopiers: lockedTrade.noOfCopiers,
  //         status: lockedTrade.status,
  //       },
  //     );

  //     return newTrade;
  //   });
  // }

  private async findAllOpenTrade() {
    const qb = this.tradeRepo
      .createQueryBuilder('trade')
      .select([
        'trade.identifier',
        'trade.asset',
        'trade.entryPrice',
        'trade.stopLoss',
        'trade.takeProfit',
        'trade.status',
        'trade.orderType',
        'trade.action',
        'trade.scheduleEndId',
        'trade.scheduleStartId',
      ])
      .addSelect('COUNT(trade.id)', 'count')
      .where('trade.status IN (:...status)', {
        status: [status.open, status.pending],
      })
      .groupBy('trade.identifier')
      .addGroupBy('trade.asset')
      .addGroupBy('trade.entryPrice')
      .addGroupBy('trade.stopLoss')
      .addGroupBy('trade.takeProfit')
      .addGroupBy('trade.status')
      .addGroupBy('trade.orderType')
      .addGroupBy('trade.action')
      .addGroupBy('trade.scheduleEndId')
      .addGroupBy('trade.scheduleStartId');

    const results = await qb.getRawMany();

    return results.map((row) => ({
      identifier: row.trade_identifier,
      asset: row.trade_asset,
      entryPrice: row.trade_entryPrice,
      stopLoss: row.trade_stopLoss,
      takeProfit: row.trade_takeProfit,
      status: row.trade_status,
      orderType: row.trade_orderType,
      action: row.trade_action,
      startingId: row.trade_scheduleStartId,
      endingId: row.trade_scheduleEndId,
      count: Number(row.count),
    }));
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
    if (query.status) filter['status'] = { $eq: query.status };
    if (query.symbol) filter['symbol'] = query.symbol;
    if (query.userId) filter['userId'] = query.userId;
    if (query.type) filter['tradeType'] = { $eq: query.type };
    if (query.asset) filter['asset'] = query.asset;
    if (query.action) filter['action'] = query.action;
    if (query.outcome) filter['outcome'] = query.outcome;
    if (query.draft) filter['isDraft'] = { $eq: query.draft };
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

    const roi =
      realizedPnL > 0
        ? Big(realizedPnL).div(Big(trade.margin)).times(Big(100)).toNumber()
        : 0;

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

  private currentPrice(asset: string): number {
    const part1 = asset.split('/')[0];
    const sym = `${part1}USDT`;
    return this.priceCache.getPrice(sym) || 0;
  }
}
