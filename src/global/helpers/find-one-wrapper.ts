import { ForbiddenException, Logger } from '@nestjs/common';
import {
  FindOneOptions,
  FindOptionsOrder,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { Document } from '../common';

const logger = new Logger('FindOneWrapper');

const buildRelations = (include: string[] = [], entity: any): string[] => {
  const validRelations = include.filter((rel) => rel in entity.prototype);
  if (validRelations.length !== include.length) {
    throw new ForbiddenException('Some included relations are invalid');
  }
  return validRelations;
};

const buildOrder = <T extends ObjectLiteral>(
  sort: string[] = [],
): FindOptionsOrder<T> => {
  const order: Record<string, 'ASC' | 'DESC'> = {};
  sort.forEach((field) => {
    order[field] = 'DESC';
  });
  return order as unknown as FindOptionsOrder<T>;
};

const buildWhere = (filters: Record<string, any>): Record<string, any> => {
  const where: Record<string, any> = {};
  for (const key in filters) {
    const value = filters[key];
    if (value !== undefined && value !== null) {
      where[key] = value;
    }
  }
  return where;
};

export const FindOneWrapper = async <T extends ObjectLiteral>(
  repo: Repository<T>,
  query: {
    include?: string[];
    sort?: string[];
    filters: Record<string, any>;
  },
): Promise<Document<T>> => {
  try {
    const { include, sort, filters } = query;

    const options: FindOneOptions<T> = {
      where: buildWhere(filters),
      relations: buildRelations(include, repo.target),
      order: buildOrder<T>(sort),
    };

    const data = await repo.findOne(options);

    logger.debug('FindOneWrapper', JSON.stringify(options));

    return { data };
  } catch (error) {
    logger.error('FindOneWrapper error', error);
    throw error;
  }
};
