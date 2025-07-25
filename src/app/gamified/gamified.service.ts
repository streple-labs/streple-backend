import { AuthUser } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameProgress, GamingOnboarding } from './entities';
import { createProgress, gameOnboard } from './interface';

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
}
