import { template } from '../services';

export interface findMany {
  page?: number;
  limit?: number;
  sort?: string[];
  include?: string[];
  filters?: Record<string, any>;
  search?: string;
}

export interface findOne {
  id: string;
  include?: string[];
  sort?: string[];
}

export interface DocumentResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Document<T> {
  data: T | null;
}

export interface transform {
  value: string | string[];
}

export type paramSearch = {
  id: string;
};

export type EmailJob = {
  users: { email: string; fullName: string }[];
  template: template;
  subject: string;
  context: Record<string, any>;
};
