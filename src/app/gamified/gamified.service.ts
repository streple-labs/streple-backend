import { BalanceService } from '@app/balance/balance.service';
import {
  BalanceMode,
  BalanceType,
  Source,
  TransactionStatus,
  TransactionType,
} from '@app/balance/interface';
import { AuthUser, DocumentResult } from '@app/common';
import { buildFindManyQuery, FindManyWrapper, Slug } from '@app/helpers';
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
  progressResponse,
} from './interface';

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
    private readonly balanceService: BalanceService,
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

    // void this.fundUser(
    //   {
    //     amount: 250,
    //     des: 'Welcome Bonus',
    //     key: `welcome ${user.id}`,
    //   },
    //   user,
    // );

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
    if (exists) {
      void this.gameProgress.update(exists.id, { score: create.score });
      return { ...exists, score: create.score };
    }

    // Calculate new earnings
    const earningsMap = this.earning(create.score);
    const earnedAmount = earningsMap[create.phase]?.[create.level] ?? 0;
    void this.fundUser(
      {
        amount: earnedAmount,
        des: `Commission upon completing ${create.level} of ${create.phase} in gamified`,
        key: `${create.phase} ${create.level} ${user.id}`,
      },
      user,
    );

    // Save progress
    const progress = await this.gameProgress.save(
      this.gameProgress.create({
        ...create,
        completedAt: new Date(),
        userId: user.id,
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
    const [userProgress, totalScore, question] = await Promise.all([
      this.gameProgress.findOne({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      }),
      this.gameProgress
        .createQueryBuilder('gameProgress')
        .select('COALESCE(SUM(gameProgress.score), 0)', 'total')
        .where('gameProgress.userId = :userId', { userId: user.id })
        .getRawOne(),
      this.onboarding.findOne({
        where: { userId: user.id },
        select: { hasAnswer: true },
      }),
    ]);

    if (!userProgress) {
      return {
        phase: 'Phase 1',
        level: 'Level 1',
        score: 0,
        completedAt: new Date().toISOString(),
        totalScore: 0,
        ...question,
      };
    }

    return {
      ...userProgress,
      totalScore: parseInt(String(totalScore.total)),
      ...question,
    };
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

  private earning(score: number) {
    const correct = score >= 70;
    const EARNINGS_MAP: Record<string, Record<string, number>> = {
      'Phase 1': {
        'Level 1': correct ? 10 : 5,
        'Level 2': correct ? 10 : 5,
        'Level 3': correct ? 10 : 5,
      },
      'Phase 2': {
        'Level 1': correct ? 50 : 20,
        'Level 2': correct ? 50 : 20,
        'Level 3': 100,
      },
      // 'Phase 3': { 'Level 3': 4000 },
    };

    return EARNINGS_MAP;
  }

  private fundUser(
    data: { amount: number; des: string; key: string },
    user: AuthUser,
  ) {
    return this.balanceService.transactionOnDemo(
      {
        amount: data.amount,
        description: data.des,
        mode: BalanceMode.demo,
        type: BalanceType.funding,
        source: Source.gamified,
        transactionType: TransactionType.deposit,
        status: TransactionStatus.successful,
        idempotencyKey: Slug(data.key),
      },
      user,
    );
  }
}
