import { findMany, findOne } from 'src/global/common';

export enum Level {
  beginner = 'Beginner',
  advance = 'Advanced',
}

export enum hubStatus {
  published = 'Published',
  draft = 'Draft',
}

export enum hubType {
  pdf = 'pdf',
  article = 'article',
}
export type ILearningHub = {
  id: string;
  title: string;
  description: string;
  content: string;
  document: string;
  thumbnail: string;
  level: Level;
  status: hubStatus;
  type: hubType;
  creatorId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type createLearning = Omit<
  ILearningHub,
  'createdAt' | 'updatedAt' | 'id' | 'creatorId'
>;

export type updatedLearning = Partial<createLearning>;

export interface findManyLearning extends findMany {
  title?: string[];
  level?: Level[];
  status?: hubStatus[];
  description?: string;
  startFrom?: Date; //filter which range
  endOn?: Date;
}

export interface findOneLearning extends findOne {
  title?: string;
  level?: Level;
  status?: hubStatus;
}
