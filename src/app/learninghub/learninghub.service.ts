import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  createLearning,
  findManyLearning,
  findOneLearning,
  updatedLearning,
} from './interface';
import {
  AuthUser,
  Document,
  DocumentResult,
  paramSearch,
} from 'src/global/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LearningHub } from './entities/learninghub.entity';
import { Repository } from 'typeorm';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from 'src/global/helpers';
import { FileProcessorService, UploadService } from 'src/global/services';
@Injectable()
export class LearningHubService {
  constructor(
    @InjectRepository(LearningHub)
    private readonly learning: Repository<LearningHub>,
    private readonly uploadFile: UploadService,
    private readonly fileProcessor: FileProcessorService,
  ) {}
  async create(
    create: createLearning,
    document: Express.Multer.File | undefined,
    thumbnail: Express.Multer.File | undefined,
    user: AuthUser,
  ): Promise<LearningHub> {
    if (document) {
      const doc = await this.fileProcessor.processCourseDocument(
        document.buffer,
        document.originalname,
      );
      create.contents = doc;
    }

    if (thumbnail) {
      const thumb = await this.uploadFile.uploadDocument(thumbnail);
      create.thumbnail = thumb;
    }

    if (create.content && create.content.trim()) {
      const result = this.fileProcessor.processCourseContent(create.content);
      create.contents = result;
    }

    const save_course = this.learning.create({ ...create, creatorId: user.id });
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
    user: AuthUser,
  ): Promise<LearningHub> {
    const { content, ...rest } = update;
    const findCourse = await this.learning.findOne({ where: { id: param.id } });

    if (!findCourse) {
      throw new ForbiddenException('Course not found');
    }

    if (findCourse.creatorId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (content && content.trim()) {
      const result = this.fileProcessor.processCourseContent(content);
      rest.contents = result;
    }

    await this.learning.update(param, rest);
    return findCourse;
  }

  async remove(param: paramSearch, user: AuthUser) {
    const learning = await this.learning.findOne({ where: param });
    if (!learning) {
      throw new ForbiddenException('Courses not found');
    }

    if (learning.creatorId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
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

    if (rest.creatorId) {
      filters = { creatorId: rest.creatorId };
    }

    if (rest.startFrom && rest.endOn) {
      const startDate = new Date(rest.startFrom);
      const endDate = new Date(rest.endOn);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        filters = { createdAt: { $gte: startDate, $lte: endDate } };
      }
    }

    return { page, sort, limit, include, search, filters };
  }
}
