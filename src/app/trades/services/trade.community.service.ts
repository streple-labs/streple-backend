import { AuthUser, DocumentResult, findMany } from '@app/common';
import { buildFindManyQuery, FindManyWrapper } from '@app/helpers';
import { Role } from '@app/users/interface';
import { UsersService } from '@app/users/service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, format, isWithinInterval, subDays } from 'date-fns';
import { Repository } from 'typeorm';
import { FollowTraders, TradeActivityFeeds, Trades } from '../entities';
import {
  createActivity,
  createFollower,
  DrawdownPoint,
  findManyActivity,
  outcome,
  PerfPoint,
  Period,
  status,
} from '../input';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(TradeActivityFeeds)
    private readonly activityRepo: Repository<TradeActivityFeeds>,
    @InjectRepository(FollowTraders)
    private readonly followTrade: Repository<FollowTraders>,
    @InjectRepository(Trades) private readonly tradeRepo: Repository<Trades>,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {}

  create(create: createActivity): Promise<TradeActivityFeeds> {
    return this.activityRepo.save(this.activityRepo.create(create));
  }

  followTrader(data: createFollower, user: AuthUser): Promise<FollowTraders> {
    return this.followTrade.save(
      this.followTrade.create({
        followerId: user.id,
        followingId: data.followingId,
      }),
    );
  }

  async allTraders(query: findMany) {
    const proTraders = await this.userService.findMany({
      ...query,
      roleName: [Role.pro],
    });
    if (!proTraders) return [];
    // TODO return full data
    return Promise.all(
      proTraders.data.map(async (user) => {
        const totalFollowers = await this.followTrade.count({
          where: { followingId: user.id },
        });
        const roi = await this.tradeRepo.sum('tradeRoi', {
          creatorId: user.id,
        });
        // Fetch all trades by this user
        const trades = await this.tradeRepo.find({
          where: { creatorId: user.id },
        });
        // Calculate average weighted risk score
        let totalWeightedRisk = 0;
        let totalPositionSize = 0;
        trades.forEach((trade) => {
          if (
            trade.stopLoss &&
            trade.entryPrice &&
            trade.positionSize?.amount
          ) {
            const risk =
              (Math.abs(trade.entryPrice - trade.stopLoss) *
                trade.positionSize.amount) /
              trade.entryPrice;
            totalWeightedRisk += risk * trade.positionSize.amount;
            totalPositionSize += trade.positionSize.amount;
          }
        });
        const riskScore =
          totalPositionSize > 0 ? totalWeightedRisk / totalPositionSize : 0;
        const data = { totalFollowers, roi, riskScore };
        return { ...user, ...data };
      }),
    );
  }

  async tradeProfileStats(traderId: string) {
    const baseQuery = this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.creatorId = :userId', { userId: traderId });

    // Get all trades for calculations
    const allTrades = await baseQuery.clone().getMany();
    if (!allTrades.length) {
      return {
        winningPosition: 0,
        totalPosition: 0,
        winRate: 0,
        profitToLossRatio: 0,
      };
    }

    const completedTrades = allTrades.filter(
      (trade) => trade.outcome && trade.status === status.close,
    );

    const winningTrades = allTrades.filter(
      (trade) => trade.outcome === outcome.win,
    );

    const losingTrades = completedTrades.filter(
      (trade) => trade.outcome === outcome.loss,
    );

    const totalProfit = winningTrades.reduce(
      (sum, trade) => sum + (trade.realizedPnl || 0),
      0,
    );

    const totalLoss = losingTrades.reduce(
      (sum, trade) => sum + (trade.realizedPnl || 0),
      0,
    );

    const winningPosition =
      winningTrades.length > 0
        ? winningTrades.reduce(
            (sum, trade) => sum + trade.positionSize.amount,
            0,
          )
        : 0;

    const totalPosition =
      completedTrades.length > 0
        ? completedTrades.reduce(
            (sum, trade) => sum + trade.positionSize.amount,
            0,
          )
        : 0;

    const winRate =
      completedTrades.length > 0
        ? (winningTrades.length / completedTrades.length) * 100
        : 0;

    let profitToLossRatio;
    if (totalLoss !== 0) {
      profitToLossRatio = totalProfit / Math.abs(totalLoss);
    } else if (totalProfit !== 0) {
      profitToLossRatio = Infinity;
    } else {
      profitToLossRatio = 0;
    }

    return { winningPosition, totalPosition, winRate, profitToLossRatio };
  }

  async profitPerformance(period: Period, userId: string) {
    const trades = await this.tradeRepo.find({ where: { creatorId: userId } });

    if (!trades.length) {
      return {
        maxDrawdown: 0,
        avgLeverage: 0,
        maxLeverage: 0,
        avgLotSize: 0,
        avgRiskPercent: 0,
      };
    }

    const filtered = this.filterTradesByPeriod(trades, period);
    return this.calculateTraderMetrics(filtered);
  }

  async drawdownCurve(days: number, userId: string) {
    const trades = await this.tradeRepo.find({ where: { creatorId: userId } });
    return this.buildDrawdownCurve(trades, days);
  }

  async performanceCurve(days: number, userId: string) {
    const trades = await this.tradeRepo.find({ where: { creatorId: userId } });
    return this.buildPerformanceCurve(trades, days);
  }

  findMany(
    query: findManyActivity,
  ): Promise<DocumentResult<TradeActivityFeeds>> {
    const qb = this.activityRepo.createQueryBuilder('activity');
    buildFindManyQuery(
      qb,
      'activity',
      this.filter(query),
      query.search,
      ['title', 'message'],
      query.include,
      query.sort,
    );

    return FindManyWrapper(qb, query.page, query.limit);
  }

  private buildPerformanceCurve(
    trades: Trades[],
    periodDays: number,
  ): PerfPoint[] {
    const end = new Date();
    const start = subDays(end, periodDays - 1);

    // Group trades by date
    const tradesByDate: Record<string, number> = {};
    trades
      .filter((trade) =>
        isWithinInterval(new Date(trade.updatedAt), { start, end }),
      )
      .forEach((trade) => {
        const d = format(new Date(trade.updatedAt), 'yyyy-MM-dd');
        tradesByDate[d] = (tradesByDate[d] || 0) + (trade.realizedPnl || 0);
      });

    // Running cumulative PnL per day
    const dateArr = this.getDateArray(start, end);
    let cumulative = 0;
    const result: PerfPoint[] = [];
    dateArr.forEach((dateStr) => {
      if (tradesByDate[dateStr]) cumulative += tradesByDate[dateStr];
      result.push({
        date: dateStr,
        cumulative,
      });
    });
    return result;
  }

  private buildDrawdownCurve(
    trades: Trades[],
    periodDays: number,
  ): DrawdownPoint[] {
    // 1. get desired window
    const end = new Date();
    const start = subDays(end, periodDays - 1); // ensures periodDays total

    // 2. group trades by date
    const tradesByDate: Record<string, number> = {};
    trades
      .filter((trade) =>
        isWithinInterval(new Date(trade.updatedAt), { start, end }),
      )
      .forEach((trade) => {
        const d = format(new Date(trade.updatedAt), 'yyyy-MM-dd');
        tradesByDate[d] = (tradesByDate[d] || 0) + (trade.realizedPnl || 0);
      });

    // 3. create a running curve from start to end (fills missing days)
    const dateArr = this.getDateArray(start, end);
    let cumulative = 0;
    let peak = 0;
    const result: DrawdownPoint[] = [];
    dateArr.forEach((dateStr) => {
      // if no trade, PnL stays flat
      if (tradesByDate[dateStr]) cumulative += tradesByDate[dateStr];
      // drawdown logic
      if (cumulative > peak) peak = cumulative;
      const drawdown = cumulative - peak;
      result.push({
        date: dateStr,
        drawdown, // negative or zero
      });
    });
    return result;
  }

  private getDateArray(start: Date, end: Date): string[] {
    const dates = [];
    let current = start;
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
    return dates;
  }

  private filterTradesByPeriod(trades: Trades[], period: Period) {
    const now = new Date();
    let start: Date;
    switch (period) {
      case 'daily':
        start = subDays(now, 1);
        break;
      case '7D':
        start = subDays(now, 7);
        break;
      case '30D':
        start = subDays(now, 30);
        break;
      case '90D':
        start = subDays(now, 90);
        break;
      default:
        start = subDays(now, 365); // fallback
    }

    return trades.filter((trade) =>
      isWithinInterval(trade.updatedAt, {
        start,
        end: now,
      }),
    );
  }

  private calculateTraderMetrics(trades: Trades[]) {
    if (!trades.length) return {};

    // 1. Max Drawdown: calculate running equity curve (cumulative realizedPnl)
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    trades
      .sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      )
      .forEach((trade) => {
        cumulative += trade.realizedPnl || 0;
        if (cumulative > peak) peak = cumulative;
        const drawdown = peak - cumulative;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

    // 2. Leverage used
    const leverages = trades.map((trade) => trade.leverage || 0);
    const avgLeverage =
      leverages.reduce((sum, l) => sum + l, 0) / leverages.length;
    const maxLeverage = Math.max(...leverages);

    // 3. Average lot size
    const avgLotSize =
      trades.reduce((sum, t) => sum + (t.positionSize?.amount || 0), 0) /
      trades.length;

    // 4. Risk per trade (%)
    const risks = trades
      .map((trade) =>
        trade.stopLoss && trade.entryPrice
          ? (Math.abs(trade.entryPrice - trade.stopLoss) *
              (trade.positionSize?.amount || 0)) /
            trade.entryPrice
          : 0,
      )
      .filter((r) => r > 0);
    const avgRisk = risks.length
      ? risks.reduce((s, v) => s + v, 0) / risks.length
      : 0;

    return {
      maxDrawdown, // in quote currency
      avgLeverage,
      maxLeverage,
      avgLotSize,
      avgRiskPercent: avgRisk * 100,
    };
  }

  private filter(query: findManyActivity) {
    const filter: Record<string, any> = {};
    if (query.userId) filter['userId'] = query.userId;
    if (query.title) filter['title'] = query.title;
    return filter;
  }
}
// riskPercent = (Math.abs(entryPrice - stopLoss) * positionSize.amount / entryPrice) / margin * 100
