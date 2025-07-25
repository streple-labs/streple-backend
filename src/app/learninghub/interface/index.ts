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

export interface question {
  title: string;
  option1: string;
  option2: string;
  option3: string;
  answer: string;
}

export type ILearningHub = {
  id: string;
  title: string;
  description: string;
  content?: string;
  contents?: string[];
  document?: string;
  thumbnail?: string;
  level: Level;
  status: hubStatus;
  type: hubType;
  questions: question[];
  creatorId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type createLearning = Omit<
  ILearningHub,
  'createdAt' | 'updatedAt' | 'id' | 'creatorId'
>;

export type updatedLearning = Partial<
  Omit<createLearning, 'document' | 'thumbnail'>
>;

export interface findManyLearning extends findMany {
  title?: string[];
  level?: Level[];
  status?: hubStatus[];
  description?: string;
  startFrom?: Date; //filter which range
  endOn?: Date;
  type?: hubType[];
}

export interface findOneLearning extends findOne {
  title?: string;
  level?: Level;
  status?: hubStatus;
}
