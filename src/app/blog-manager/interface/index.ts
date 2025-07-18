import { findMany, findOne } from 'src/global/common';

export enum blogStatus {
  publish = 'Published',
  draft = 'Draft',
  Schedule = 'Scheduled',
}

export interface IBlogManager {
  id: string;
  title: string;
  content: string;
  tags: string[];
  thumbnail?: string;
  metatitle: string;
  description: string;
  slug: string;
  scheduleDate: Date;
  creatorId: string | null;
  view: number;
  status: blogStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface createBlog
  extends Omit<
    IBlogManager,
    'id' | 'slug' | 'createdAt' | 'updatedAt' | 'creatorId' | 'status' | 'view'
  > {
  draft: boolean;
  schedule: boolean;
}

export type updatedBlog = Partial<createBlog>;

export interface findManyBlog extends findMany {
  tags?: string[];
  creatorId?: string[];
  status?: blogStatus[];
  metatitle?: string[];
  startFrom?: Date;
  endAt?: Date;
}

export interface findOneBlog extends findOne {
  tags?: string;
  creatorId?: string;
  status?: blogStatus;
  metatitle?: string;
  slug?: string;
}
