import { ForbiddenException, Injectable } from '@nestjs/common';
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
import { UploadService } from 'src/global/services';
@Injectable()
export class LearningHubService {
  constructor(
    @InjectRepository(LearningHub)
    private readonly learning: Repository<LearningHub>,
    private readonly uploadFile: UploadService,
  ) {}
  async create(
    create: createLearning,
    document: Express.Multer.File | undefined,
    thumbnail: Express.Multer.File | undefined,
  ): Promise<LearningHub> {
    if (document) {
      const doc = await this.uploadFile.uploadDocument(document, 'documents');
      create.document = doc;
    }

    if (thumbnail) {
      const thumb = await this.uploadFile.uploadDocument(thumbnail);
      create.thumbnail = thumb;
    }

    const save_course = this.learning.create(create);
    return this.learning.save(save_course);
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

  async update(
    param: paramSearch,
    update: updatedLearning,
  ): Promise<LearningHub> {
    const findCourse = await this.learning.findOne({ where: { id: param.id } });

    if (!findCourse) {
      throw new ForbiddenException('Course not found');
    }

    await this.learning.update(param.id, update);
    return findCourse;
  }

  remove(param: paramSearch) {
    return this.learning.delete(param.id);
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

    if (rest.type) {
      filters = { type: rest.type };
    }

    if (rest.startFrom && rest.endOn) {
      filters = { createdAt: { $gte: rest.startFrom, $lte: rest.endOn } };
    }

    return { page, sort, limit, include, search, filters };
  }
}
