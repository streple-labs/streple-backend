import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Document, DocumentResult, paramSearch } from 'src/global/common';
import {
  blogStatus,
  createBlog,
  findManyBlog,
  findOneBlog,
  updatedBlog,
} from './interface';
import { InjectRepository } from '@nestjs/typeorm';
import { BlogManager } from './entities/blog-manager.entity';
import { Repository } from 'typeorm';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from 'src/global/helpers';
import { BlogJobWorker, UploadService } from 'src/global/services';

@Injectable()
export class BlogManagerService {
  constructor(
    @InjectRepository(BlogManager)
    private readonly blog: Repository<BlogManager>,

    @Inject(forwardRef(() => BlogJobWorker))
    private readonly blogJobWorker: BlogJobWorker,

    @Inject(forwardRef(() => UploadService))
    private readonly uploadFile: UploadService,
  ) {}

  async create(blog: createBlog, file: Express.Multer.File) {
    const { schedule, draft, ...data } = blog;

    if (file) {
      const thumbnail = await this.uploadFile.uploadDocument(file);
      data.thumbnail = thumbnail;
    }

    const slug = this.slug(data.title);
    // TODO add user that create the blog id as creatorID
    if (schedule) {
      if (!data.scheduleDate) {
        throw new ForbiddenException('Schedule data is invalid');
      }

      const save_schedule = this.blog.create({
        ...data,
        creatorId: null,
        slug,
        status: blogStatus.Schedule,
      });

      // schedule the blog
      const delay = data.scheduleDate.getTime() - Date.now();
      this.blogJobWorker.scheduleDelayedEmail({ id: save_schedule.id }, delay);
      return this.blog.save(save_schedule);
    }

    // TODO add the creator id when the user is available
    const save_blog = this.blog.create({
      ...data,
      slug,
      creatorId: null,
      status: draft ? blogStatus.draft : blogStatus.publish,
    });

    return this.blog.save(save_blog);
  }

  findAll(query: findManyBlog): Promise<DocumentResult<BlogManager>> {
    const filters = this.filter(query);
    const qb = this.blog.createQueryBuilder('blog');
    buildFindManyQuery(
      qb,
      'blog',
      filters,
      query.search,
      ['title', 'content', 'metatitle'],
      query.include,
      query.sort,
    );

    return FindManyWrapper(qb, query.page, query.limit);
  }

  async findOne(query: findOneBlog): Promise<Document<BlogManager>> {
    const { include, sort, ...filters } = query;
    const document = await FindOneWrapper<BlogManager>(this.blog, {
      include,
      sort,
      filters,
    });

    if (document) {
      await this.blog
        .createQueryBuilder()
        .update(BlogManager)
        .set({ view: () => 'view + 1' })
        .where(filters)
        .execute();
    }

    return document;
  }

  async update(param: paramSearch, update: updatedBlog) {
    const blog = await this.blog.findOne({ where: { id: param.id } });

    if (!blog) {
      throw new ForbiddenException('Blog post not found');
    }

    // if blog status is draft and needs to change it to schedule
    if (
      blog?.status === blogStatus.draft &&
      update.status === blogStatus.Schedule
    ) {
      if (!update.scheduleDate) {
        throw new ForbiddenException('Schedule should be added');
      }
      // schedule the date
      const delay = update.scheduleDate.getTime() - Date.now();

      if (delay <= 0) {
        throw new ForbiddenException('Schedule date is in the past');
      }

      this.blogJobWorker.scheduleDelayedEmail({ id: blog.id }, delay);
      await this.blog.update(param.id, update);
      return blog;
    }

    // // if blog status is schedule and the updated status is still schedule
    // if (
    //   blog?.status === blogStatus.Schedule &&
    //   update.status === blogStatus.Schedule
    // ) {
    //   return this.blog.update({ id: blog.id }, update);
    // }
    // when any of them is not responding
    await this.blog.update({ id: blog.id }, update);
    return blog;
  }

  remove(param: paramSearch) {
    console.log(param);
  }

  private filter(query: findManyBlog) {
    let filters: Record<string, any> = {};

    if (query.creatorId) {
      filters = { creatorId: query.creatorId };
    }
    if (query.endAt && query.startFrom) {
      const startDate = new Date(query.startFrom);
      const endDate = new Date(query.endAt);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        filters = { createdAt: { $gte: startDate, $lte: endDate } };
      }
    }

    if (query.metatitle) {
      filters = { metatitle: query.metatitle };
    }

    if (query.status) {
      filters = { status: query.status };
    }
    if (query.tags) {
      filters = { tags: { $in: query.tags } };
    }

    return filters;
  }

  private slug(name: string): string {
    return name.replace(/\s+/g, '-').toLowerCase();
  }
}
