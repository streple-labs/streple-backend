import { AuthUser, DocumentResult } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge, GameProgress, GamingOnboarding, UserBadge } from './entities';
import {
  badgesResponse,
  createProgress,
  earnBadge,
  findManyGameProgress,
  findManyOnboardedUser,
  gameOnboard,
  Level,
  Phase,
  progressResponse,
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
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
  ) {}

  async create(create: gameOnboard, user: AuthUser): Promise<GamingOnboarding> {
    const haveAnswered = await this.onboarding.findOne({
      where: { userId: user.id },
    });
    if (haveAnswered) return haveAnswered;

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
  ): Promise<progressResponse> {
    // Check if progress already exists
    const exists = await this.gameProgress.findOne({
      where: { userId: user.id, phase: create.phase, level: create.level },
    });
    if (exists) return exists;

    // Get the latest earnings or 0
    const latestProgress = await this.gameProgress.findOne({
      where: { userId: user.id },
      select: ['earn'],
      order: { createdAt: 'DESC' },
    });
    const currentEarnings = latestProgress?.earn ?? 0;

    // Calculate new earnings
    const earningsMap = this.earning();
    const earnedAmount = earningsMap[create.phase]?.[create.level] ?? 0;
    const totalEarnings = parseInt(String(currentEarnings), 10) + earnedAmount;

    // Save progress
    const progress = await this.gameProgress.save(
      this.gameProgress.create({
        ...create,
        completedAt: new Date(),
        userId: user.id,
        earn: totalEarnings,
      }),
    );

    // Award badge
    const badge = await this.earnBadges(
      { phase: create.phase, level: create.level },
      user,
    );

    return { ...progress, badge };
  }

  async userProgress(user: AuthUser) {
    const userProgress = await this.gameProgress.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
    return userProgress;
  }

  async earnBadges(
    data: earnBadge,
    user: AuthUser,
  ): Promise<badgesResponse | null> {
    // check if the level is level 3
    if (data.level !== Level.third) return null;

    const badge = await this.badgeRepo.findOne({
      where: { phase: data.phase },
    });

    if (!badge) return null;

    // find if user have already earn the badge
    const exists = await this.userBadge.findOne({
      where: { userId: user.id, badgeId: badge.id },
    });

    if (exists) return { ...exists, image: badge.image };

    const save = this.userBadge.create({
      userId: user.id,
      badgeId: badge.id,
      earnedAt: new Date(),
    });

    const theBadge = await this.userBadge.save(save);
    return { ...theBadge, image: badge.image };
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

  private earning() {
    const EARNINGS_MAP: Record<string, Record<string, number>> = {
      'Phase 1': { 'Level 1': 500, 'Level 2': 1000, 'Level 3': 1500 },
      'Phase 2': { 'Level 1': 500, 'Level 2': 1000, 'Level 3': 1500 },
      'Phase 3': { 'Level 3': 4000 },
    };

    return EARNINGS_MAP;
  }
}
