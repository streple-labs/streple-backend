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
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Trades } from './entities/trader.entity';
import {
  copyTrade,
  createTrade,
  findManyTrade,
  findOneTrade,
  status,
  type,
  updateTrade,
} from './input';

@Injectable()
export class TradesService {
  constructor(
    @InjectRepository(Trades) private readonly tradeRepo: Repository<Trades>,
    private readonly httpClient: HttpClientService,
    private readonly wsGateway: WebSocketService,
  ) {}

  async create(create: createTrade, user: AuthUser): Promise<Trades> {
    // Check for duplicate trade with same symbol and open status for this user
    const duplicate = await this.tradeRepo.findOne({
      where: {
        symbol: create.symbol,
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
    const identifier = `${create.symbol}_${uuidv4()}`;
    const userId = user.id;
    const creatorId = user.id;

    // TODO debit user account the amount he/she want to use to stake
    const save = this.tradeRepo.create({
      ...create,
      identifier,
      type: type.original,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, userId, stakeAmount, ...rest } = trade;
    const save = this.tradeRepo.create({
      ...rest,
      userId: user.id,
      stakeAmount: dto.stakeAmount,
      type: type.copy,
    });
    // recreate with new userid
    return this.tradeRepo.save(save);
  }

  async cancelTrade(tradeId: string, user: AuthUser): Promise<Trades> {
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
    return FindManyWrapper(qb, query.page, query.limit);
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
    return FindOneWrapper<Trades>(this.tradeRepo, { include, sort, filters });
  }

  async update(
    id: string,
    update: updateTrade,
    user: AuthUser,
  ): Promise<Trades> {
    //first find the trader
    const trade = await this.tradeRepo.findOne({ where: { id } });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (trade.creatorId.toLowerCase() !== user.id.toLowerCase()) {
      throw new UnauthorizedException('Edit access blocked');
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
    const trade = await this.tradeRepo.findOne({ where: { id } });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (trade.creatorId.toLowerCase() !== user.id.toLowerCase()) {
      throw new UnauthorizedException('Delete access blocked');
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
      filter = { type: { $eq: query.type } };
    }

    return filter;
  }
}
