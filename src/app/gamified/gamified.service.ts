import { AuthUser, DocumentResult } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameProgress, GamingOnboarding } from './entities';
import {
  createProgress,
  findManyGameProgress,
  findManyOnboardedUser,
  gameOnboard,
} from './interface';
import { buildFindManyQuery, FindManyWrapper } from '@app/helpers';

@Injectable()
export class GamifiedService {
  constructor(
    @InjectRepository(GamingOnboarding)
    private readonly onboarding: Repository<GamingOnboarding>,
    @InjectRepository(GameProgress)
    private readonly gameProgress: Repository<GameProgress>,
  ) {}

  async create(create: gameOnboard, user: AuthUser): Promise<GamingOnboarding> {
    const question = this.onboarding.create({ ...create, userId: user.id });
    return await this.onboarding.save(question);
  }

  async trackUserProgress(
    create: createProgress,
    user: AuthUser,
  ): Promise<GameProgress> {
    const today = new Date();
    const track = this.gameProgress.create({
      ...create,
      completedAt: today,
      userId: user.id,
    });
    return await this.gameProgress.save(track);
  }

  findMany(
    query: findManyOnboardedUser,
  ): Promise<DocumentResult<GamingOnboarding>> {
    const { page, sort, limit, include, search, ...filter } = query;
    const where = this.filter(filter);
    const qb = this.onboarding.createQueryBuilder('game_onboarding');

    buildFindManyQuery(qb, 'game_onboarding', where, search, [], include, sort);
    return FindManyWrapper(qb, page, limit);
  }

  findManyProgress(
    query: findManyGameProgress,
  ): Promise<DocumentResult<GameProgress>> {
    const { page, sort, limit, include, search, ...filter } = query;
    const where = this.progressFilter(filter);
    const qb = this.gameProgress.createQueryBuilder('game_progress');

    buildFindManyQuery(qb, 'game_progress', where, search, [], include, sort);
    return FindManyWrapper(qb, page, limit);
  }

  private progressFilter(query: findManyGameProgress) {
    let filters: Record<string, any> = {};

    if (query.userId) {
      filters = { userId: query.userId };
    }

    if (query.level) {
      filters = { level: query.level };
    }

    if (query.phase) {
      filters = { phase: query.phase };
    }

    return filters;
  }

  private filter(query: findManyOnboardedUser) {
    let filters: Record<string, any> = {};

    if (query.userId) {
      filters = { userId: query.userId };
    }

    if (query.hasAnswer) {
      filters = { hasAnswer: query.hasAnswer };
    }

    return filters;
  }
}
