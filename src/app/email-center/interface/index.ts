import { findMany, findOne } from 'src/global/common';

export enum EmailStatus {
  draft = 'Draft',
  scheduled = 'Scheduled',
  failed = 'Failed',
  sent = 'Sent',
}

export enum EmailRecipient {
  users = 'All users',
  copiers = 'Copiers',
  pro = 'Protraders',
  wait = 'WaitList',
}

export interface IWaitList {
  id: string;
  name?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailCenter {
  id: string;
  subject: string;
  status: EmailStatus;
  message: string;
  recipient: EmailRecipient;
  selected: string[];
  scheduleDate: Date;
  openRate: number;
  clickRate: number;
  error: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface createEmail
  extends Pick<
    IEmailCenter,
    'subject' | 'message' | 'recipient' | 'scheduleDate' | 'selected'
  > {
  schedule: boolean;
  draft: boolean;
}

export interface updateEmail
  extends Partial<Omit<createEmail, 'draft' | 'schedule'>> {
  status?: EmailStatus;
  error?: string;
}

export interface findOneEmail extends findOne {
  status?: EmailStatus;
  openRate?: number;
  clickRate?: number;
  recipient?: EmailRecipient;
  scheduleDate?: Date;
}

export interface findManyEmail extends findMany {
  status?: EmailStatus[];
  openRate?: number[];
  clickRate?: number[];
  recipient?: EmailRecipient[];
  scheduleDate?: Date[];
}
