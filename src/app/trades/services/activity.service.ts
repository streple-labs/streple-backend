import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TradeActivityFeeds } from '../entities';
import { Repository } from 'typeorm';
import { createActivity, findManyActivity } from '../input';
import { DocumentResult } from '@app/common';
import { buildFindManyQuery, FindManyWrapper } from '@app/helpers';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(TradeActivityFeeds)
    private readonly activityRepo: Repository<TradeActivityFeeds>,
  ) {}

  create(create: createActivity) {
    return this.activityRepo.save(this.activityRepo.create(create));
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

  private filter(query: findManyActivity) {
    const filter: Record<string, any> = {};
    if (query.userId) filter['userId'] = query.userId;
    if (query.title) filter['title'] = query.title;
    return filter;
  }
}
