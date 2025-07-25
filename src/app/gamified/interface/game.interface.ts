export enum Phase {
  first = 'Phase 1',
  second = 'Phase 2',
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

export interface IBadge {
  id: string;
  phase: Phase;
  name: string;
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

export interface gameOnboard {
  userId?: string;
  firstQuestion: string;
  secondQuestion: string;
  thirdQuestion: string;
  createdAt?: Date;
  updatedAt?: Date;
}
