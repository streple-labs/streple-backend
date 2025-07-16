import { Injectable } from '@nestjs/common';
import {
  createLearning,
  findManyLearning,
  findOneLearning,
  updatedLearning,
} from './interface';
import { Document, DocumentResult, paramSearch } from 'src/global/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LearningHub } from './entities/learninghub.entity';
import { Repository } from 'typeorm';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from 'src/global/helpers';

@Injectable()
export class LearningHubService {
  constructor(
    @InjectRepository(LearningHub)
    private readonly learning: Repository<LearningHub>,
  ) {}
  create(create: createLearning) {
    console.log(create);
    return;
  }

  findAll(query: findManyLearning): Promise<DocumentResult<LearningHub>> {
    const { page, sort, limit, include, search, filters } = this.filter(query);
    const qb = this.learning.createQueryBuilder('learning_hub');

    buildFindManyQuery(
      qb,
      'learning_hub',
      filters,
      search,
      ['title', 'status', 'description'],
      include,
      sort,
    );

    return FindManyWrapper(qb, page, limit);
  }

  findOne(query: findOneLearning): Promise<Document<LearningHub>> {
    const { include, sort, ...filters } = query;

    return FindOneWrapper<LearningHub>(this.learning, {
      include,
      sort,
      filters,
    });
  }

  update(param: paramSearch, update: updatedLearning) {
    console.log({ param, update });
    return;
  }

  remove(param: paramSearch) {
    console.log(param);
    return;
  }

  private filter(query: findManyLearning) {
    const { page, sort, limit, include, search, ...rest } = query;
    let filters: Record<string, any> = {};

    if (rest.description) {
      filters = { description: rest.description };
    }

    if (rest.title) {
      filters = { title: rest.title };
    }

    if (rest.level) {
      filters = { level: rest.level };
    }

    if (rest.status) {
      filters = { status: rest.status };
    }

    if (rest.startFrom && rest.endOn) {
      filters = { createdAt: { $gte: rest.startFrom, $lte: rest.endOn } };
    }

    return { page, sort, limit, include, search, filters };
  }
}
