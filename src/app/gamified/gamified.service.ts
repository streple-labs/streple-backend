import { AuthUser, DocumentResult } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameProgress, GamingOnboarding, UserBadge } from './entities';
import {
  createProgress,
  findManyGameProgress,
  findManyOnboardedUser,
  gameOnboard,
  Level,
  Phase,
} from './interface';
import { buildFindManyQuery, FindManyWrapper } from '@app/helpers';

@Injectable()
export class GamifiedService {
  constructor(
    @InjectRepository(GamingOnboarding)
    private readonly onboarding: Repository<GamingOnboarding>,
    @InjectRepository(GameProgress)
    private readonly gameProgress: Repository<GameProgress>,
    @InjectRepository(UserBadge)
    private readonly userBadge: Repository<UserBadge>,
  ) {}

  async create(create: gameOnboard, user: AuthUser): Promise<GamingOnboarding> {
    const question = this.onboarding.create({
      ...create,
      hasAnswer: true,
      userId: user.id,
    });
    const data = await this.onboarding.save(question);
    await this.trackUserProgress(
      { phase: Phase.first, level: Level.first, score: 0 },
      user,
    );

    return data;
  }

  async trackUserProgress(
    create: createProgress,
    user: AuthUser,
  ): Promise<GameProgress> {
    const today = new Date();

    const userProgress = await this.gameProgress.findOne({
      where: { userId: user.id },
      select: ['earn'],
      order: { createdAt: 'DESC' },
    });

    const track = this.gameProgress.create({
      ...create,
      completedAt: today,
      userId: user.id,
    });

    const earningsMap: Record<string, Record<string, number>> = {
      'Phase 1': {
        'Level 3': 500,
      },
      'Phase 2': {
        'Level 3': 2000,
      },
      'Phase 3': {
        'Level 3': 4000,
      },
    };

    const earnings = earningsMap[create.phase]?.[create.level];
    if (earnings !== undefined) {
      track.earn = parseInt(String(userProgress?.earn), 10) + earnings;
    } else {
      track.earn = parseInt(String(userProgress?.earn), 10);
    }

    return await this.gameProgress.save(track);
  }

  async userProgress(user: AuthUser) {
    const userProgress = await this.gameProgress.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
    return userProgress;
  }

  // async earnBadges(data, user: AuthUser): Promise<UserBadge> {
  //   return;
  // }

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
