import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Protrader } from '../entity';
import { Repository, TypeORMError } from 'typeorm';
import {
  createProTrader,
  findManyProTrader,
  findOneProTrader,
} from '../interface';
import { Document, DocumentResult } from '@app/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from '@app/helpers';

@Injectable()
export class ProTraderService {
  constructor(
    @InjectRepository(Protrader)
    private readonly prorepo: Repository<Protrader>,
  ) {}

  async createProTrader(dto: createProTrader): Promise<Protrader> {
    try {
      const trader = await this.prorepo.findOneBy({ email: dto.email });
      if (trader) {
        throw new ForbiddenException(
          'Pro trader with this email already exists',
        );
      }
      const protrader = this.prorepo.create(dto);
      return this.prorepo.save(protrader);
    } catch (error) {
      if (error instanceof TypeORMError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  async findManyProTrader(
    query: findManyProTrader,
  ): Promise<DocumentResult<Protrader>> {
    try {
      const where = this.filter(query);
      const qb = this.prorepo.createQueryBuilder('protrader');
      buildFindManyQuery(
        qb,
        'protrader',
        where,
        query.search,
        ['name', 'email'],
        query.include,
        query.sort,
      );
      return FindManyWrapper(qb, query.page, query.limit);
    } catch (error) {
      if (error instanceof TypeORMError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  async findOneProtrader(
    query: findOneProTrader,
  ): Promise<Document<Protrader>> {
    try {
      const { include, sort, ...filters } = query;
      return FindOneWrapper<Protrader>(this.prorepo, {
        include,
        sort,
        filters,
      });
    } catch (error) {
      if (error instanceof TypeORMError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  private filter(query: findManyProTrader) {
    const where: Record<string, any> = {};
    if (query.name) where['name'] = query.name;
    if (query.email) where['email'] = query.email;
    return where;
  }
}
