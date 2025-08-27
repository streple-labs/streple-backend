/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { AuthUser, Document, DocumentResult } from '@app/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from '@app/helpers';
import { HttpClientService, WebSocketService } from '@app/services';
import {
  ForbiddenException,
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
  copyTrade,
  createTrade,
  findManyTrade,
  findOneTrade,
  ITrades,
  outcome,
  status,
  tokenPrice,
  tokenPriceResponse,
  TradingStats,
  type,
  updateTrade,
} from './input';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trades) private readonly tradeRepo: Repository<Trades>,
    private readonly httpClient: HttpClientService,
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
    const isOpen = Big(currentPrice).eq(Big(create.entryPrice));
    const tradeStatus = isOpen ? status.open : status.pending;

    // TODO debit user account the amount he/she want to use to stake
    const save = this.tradeRepo.create({
      ...create,
      identifier,
      symbol,
      tradeType: type.original,
      image,
      currentPrice,
      status: tradeStatus,
      userId,
      creatorId,
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

    // TODO debit user account the amount he/she want to use to stake
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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, userId, stakeAmount, ...rest } = lockedTrade;
      const noOfCopies = Big(trade.noOfCopiers).plus(Big(1));

      const save = manager.create(Trades, {
        ...rest,
        userId: user.id,
        stakeAmount: dto.stakeAmount,
        currentPrice,
        noOfCopiers: noOfCopies.toNumber(),
      });

      const newTrade = await manager.save(save);

      await manager.update(
        Trades,
        { identifier: trade.identifier },
        {
          currentPrice,
          noOfCopiers: noOfCopies.toNumber(),
        },
      );

      return newTrade;
    });
  }

  async cancelTrade(tradeId: string, user: AuthUser): Promise<ITrades> {
    // TODO refund the user stake amount
    const trade = await this.tradeRepo.findOne({
      where: { id: tradeId, userId: user.id, status: Not(status.close) },
    });
    if (!trade) {
      throw new ForbiddenException('Trade not exist or Trade already close');
    }

    // eslint-disable-next-line prefer-const
    let exitPrice: number | undefined = 0;
    // const { data } = await this.httpClient.fetchData(
    //   'https://coingecko.com/api',
    //   {
    //     authorization: `Bearer ...`,
    //   },
    // );

    // if (!data) {
    //   exitPrice = trade.stakeAmount;
    // } else {
    //   exitPrice = 2000; //price from the response
    // }

    await this.tradeRepo.update(
      { id: tradeId },
      { status: status.close, exitPrice: exitPrice },
    );
    return { ...trade, status: status.close, exitPrice: exitPrice };
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
      [],
      query.include,
      query.sort,
    );
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
      riskLevelTrends: 'medium',
      // additionalMetrics: {
      //   totalVolume: Math.round(totalVolume * 100) / 100,
      //   averageStakeAmount: Math.round(averageStakeAmount * 100) / 100,
      //   mostTradedSymbol,
      //   bestPerformingTrade: Math.round(bestPerformingTrade * 100) / 100,
      //   worstPerformingTrade: Math.round(worstPerformingTrade * 100) / 100,
      //   totalTrades: allTrades.length,
      // },
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

    // allow update
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

  private filter(query: findManyTrade) {
    let filter: Record<string, any> = {};

    if (query.creatorId) {
      filter = { creatorId: query.creatorId };
    }

    if (query.status) {
      filter = { status: query.status };
    }

    if (query.symbol) {
      filter = { symbol: query.symbol };
    }

    if (query.userId) {
      filter = { userId: query.userId };
    }

    if (query.type) {
      filter = { tradeType: { $eq: query.type } };
    }

    return filter;
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
