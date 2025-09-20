import { findMany } from '@app/common';

export enum Phase {
  first = 'Phase 1',
  second = 'Phase 2',
  third = 'Phase 3',
}

export enum Level {
  first = 'Level 1',
  second = 'Level 2',
  third = 'Level 3',
}

export interface gameProgress {
  userId: string;
  phase: Phase;
  level: Level;
  score: number;
  completedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type createProgress = Pick<gameProgress, 'level' | 'phase' | 'score'>;
export interface progressResponse extends gameProgress {
  badge?: badgesResponse | null;
}

export interface findManyOnboardedUser extends findMany {
  userId?: string[];
  hasAnswer?: boolean;
}

export interface findManyGameProgress extends findMany {
  userId?: string[];
  phase?: Phase[];
  level?: Level[];
}

export interface IBadge {
  id?: string;
  phase: Phase;
  name?: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserBadge {
  userId: string;
  badgeId: string;
  earnedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface badgesResponse extends IUserBadge {
  image: string;
}

export interface earnBadge {
  phase: Phase;
  level: Level;
}

export interface gameOnboard {
  userId?: string;
  firstQuestion: string;
  secondQuestion: string;
  thirdQuestion?: string;
  hasAnswer?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
