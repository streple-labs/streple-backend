import { findMany } from '@app/common';
import { IUser } from '@app/users/interface';

export interface ActivityFeed {
  id: string;
  title: string;
  message: string;
  userId: string;
  user: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export type createActivity = Pick<ActivityFeed, 'title' | 'message' | 'userId'>;

export interface findManyActivity extends findMany {
  userId?: string[];
  title?: string[];
}
