import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralRewardSetting } from './entities';
import {
  createReferral,
  createReward,
  findManyReferral,
  findManyReward,
  findOneReferral,
  ReferralHistory,
  ReferralLevel,
  ReferralStatus,
  updatedReward,
} from './input';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from '@app/helpers';
import { AuthUser, Document, DocumentResult } from '@app/common';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral) private readonly referral: Repository<Referral>,
    @InjectRepository(ReferralRewardSetting)
    private readonly referralReward: Repository<ReferralRewardSetting>,
  ) {}
  async create(data: createReferral): Promise<Referral[] | undefined> {
    const { directReferrerId, userId } = data;

    if (!directReferrerId) return;

    const insertDetails: ReferralHistory[] = [];
    let indirectReferrerId: string | undefined = undefined;

    const levelAmount = await this.referralReward.find();

    // Helper for rewards using dynamic settings and level
    const getReward = (count: number, level: ReferralLevel) => {
      // Filter rewards for the given level
      const rewardsForLevel = levelAmount
        .filter((r) => r.level === level)
        .sort((a, b) => b.count - a.count);

      for (const reward of rewardsForLevel) {
        if (count >= reward.count) {
          return {
            amount: reward.amount,
            hasBadge: reward.count >= 50,
            exclusive: reward.count >= 150,
          };
        }
      }
      // Default values for each level
      if (level === ReferralLevel.LEVEL_1) {
        return { amount: 10, hasBadge: false, exclusive: false };
      }
      if (level === ReferralLevel.LEVEL_2) {
        return { amount: 5, hasBadge: false, exclusive: false };
      }
      return { amount: 0, hasBadge: false, exclusive: false };
    };

    const findIndirect = await this.referral.findOne({
      where: { userId: directReferrerId, status: ReferralStatus.ACTIVE },
    });

    // Handle indirect (second level) referrer, if any
    if (findIndirect) {
      indirectReferrerId = findIndirect.directReferrerId;
      const directCount = await this.referral.count({
        where: { indirectReferrerId },
      });
      const reward = getReward(directCount, ReferralLevel.LEVEL_1);
      insertDetails.push({
        userId: String(userId),
        directReferrerId,
        indirectReferrerId,
        level: ReferralLevel.LEVEL_2,
        amount: reward.amount,
        status: ReferralStatus.PENDING,
        hasBadge: reward.hasBadge,
        exclusive: reward.exclusive,
      });
      // TODO something with 'exclusive' here if needed
    }

    // Handle direct (first level) referrer
    const directCount = await this.referral.count({
      where: { directReferrerId },
    });
    const reward = getReward(directCount, ReferralLevel.LEVEL_1);

    insertDetails.push({
      userId: String(userId),
      directReferrerId,
      indirectReferrerId,
      level: ReferralLevel.LEVEL_1,
      amount: reward.amount,
      status: ReferralStatus.PENDING,
      hasBadge: reward.hasBadge,
      exclusive: reward.exclusive,
    });

    return this.referral.save(insertDetails);
  }

  async createReward(data: createReward): Promise<ReferralRewardSetting> {
    return this.referralReward.save(this.referralReward.create(data));
  }

  async referrerStats(user: AuthUser) {
    const filter = {
      status: ReferralStatus.ACTIVE,
      directReferrerId: user.id,
    };

    const [rewards, referral] = await Promise.allSettled([
      await this.referral
        .createQueryBuilder('referral')
        .select('SUM(referral.amount)', 'sum')
        .where(
          '(referral.directReferrerId = :id OR referral.indirectReferrerId = :id) AND referral.status = :status',
          { id: user.id, status: ReferralStatus.ACTIVE },
        )
        .getRawOne(),
      this.referral.count({ where: filter }),
    ]);

    const totalRewards = rewards.status === 'fulfilled' ? rewards.value.sum : 0;
    const totalReferral = referral.status === 'fulfilled' ? referral.value : 0;

    // Determine next milestone
    let nextMilestone = 0;
    if (totalReferral < 25) {
      nextMilestone = 25;
    } else if (totalReferral < 50) {
      nextMilestone = 50;
    } else if (totalReferral < 100) {
      nextMilestone = 100;
    }

    let percentToNext = 100;
    if (nextMilestone > 0) {
      percentToNext = Math.round((totalReferral / nextMilestone) * 100);
    }

    return {
      totalRewards,
      totalReferral,
      nextMilestone: nextMilestone > 0 ? nextMilestone : null,
      percentToNext: nextMilestone > 0 ? percentToNext : 100,
      milestoneReached:
        totalReferral >= 100
          ? '100+'
          : totalReferral >= 50
            ? '50'
            : totalReferral >= 25
              ? '25'
              : '0',
    };
  }

  async findAlReward(
    query: findManyReward,
  ): Promise<DocumentResult<ReferralRewardSetting>> {
    const filter: Record<string, any> = {};
    if (query.level) filter['level'] = { $eq: query.level };
    const qb = this.referralReward.createQueryBuilder('reward');
    buildFindManyQuery(
      qb,
      'reward',
      filter,
      query.search,
      [],
      query.include,
      query.sort,
    );

    return FindManyWrapper(qb, query.page, query.limit);
  }

  async getTopReferrers(limit: number) {
    // Only join and select the user fields you want (not all referral fields)
    const qb = this.referral
      .createQueryBuilder('referral')
      .select('referral.directReferrerId', 'directReferrerId')
      .addSelect('COUNT(referral.id)', 'referralCount')
      .addSelect('user.id', 'userId')
      .addSelect('user.fullName', 'userFullName')
      .addSelect('user.email', 'userEmail')
      .leftJoin('referral.directReferrer', 'user')
      .where('referral.status = :status', { status: ReferralStatus.ACTIVE })
      .groupBy('referral.directReferrerId')
      .addGroupBy('user.id')
      .addGroupBy('user.fullName')
      .addGroupBy('user.email')
      .orderBy('COUNT(referral.id)', 'DESC')
      .limit(limit);

    const raw = await qb.getRawMany();

    // Return your custom leaderboard array
    return raw.map((row) => ({
      directReferrerId: row.directReferrerId,
      referralCount: Number(row.referralCount),
      user: {
        id: row.userId,
        fullName: row.userFullName,
        email: row.userEmail,
      },
    }));
  }

  findAll(query: findManyReferral): Promise<DocumentResult<Referral>> {
    const where = this.filterReferral(query);
    const qb = this.referral.createQueryBuilder('referral');
    buildFindManyQuery(
      qb,
      'referral',
      where,
      query.search,
      [],
      query.include,
      query.sort,
    );

    return FindManyWrapper(qb, query.page, query.limit);
  }

  findOne(query: findOneReferral): Promise<Document<Referral>> {
    const { include, sort, ...filters } = query;
    return FindOneWrapper<Referral>(this.referral, {
      include,
      sort,
      filters,
    });
  }

  async update(filter: string, data: updatedReward) {
    const findUser = await this.referralReward.findOne({
      where: { id: filter },
    });

    if (!findUser) {
      throw new NotFoundException('Referral not found');
    }

    await this.referralReward.update({ id: filter }, { ...data });
    return { ...findUser, ...data };
  }

  async remove(filter: string) {
    const findUser = await this.referralReward.findOne({
      where: { id: filter },
    });

    if (!findUser) {
      throw new NotFoundException('Referral not found');
    }
    return this.referralReward.delete({ id: filter });
  }

  private filterReferral(query: findManyReferral) {
    const filter: Record<string, any> = {};
    if (query.directReferrerId) {
      filter['directReferrerId'] = query.directReferrerId;
    }
    if (query.indirectReferrerId) {
      filter['indirectReferrerId'] = query.indirectReferrerId;
    }
    if (query.exclusive) filter['exclusive'] = query.exclusive;
    if (query.hasBadge) filter['hasBadge'] = query.hasBadge;
    if (query.status) filter['status'] = { $eq: query.status };
    if (query.level) filter['level'] = { $eq: query.level };
    return filter;
  }
}
