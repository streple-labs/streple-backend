import { Role } from '@app/users/interface';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AuthUser,
  Document,
  DocumentResult,
  paramSearch,
} from 'src/global/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
  Slug,
} from 'src/global/helpers';
import { UploadService } from 'src/global/services';
import { Repository } from 'typeorm';
import { BlogManager } from '../entities/blog-manager.entity';
import {
  blogStatus,
  createBlog,
  findManyBlog,
  findOneBlog,
  updatedBlog,
} from '../interface';
import { BlogScheduleService } from './blog-schedule.service';

@Injectable()
export class BlogManagerService {
  constructor(
    @InjectRepository(BlogManager)
    private readonly blog: Repository<BlogManager>,

    @Inject(forwardRef(() => BlogScheduleService))
    private readonly blogJobWorker: BlogScheduleService,
    private readonly uploadFile: UploadService,
  ) {}

  async create(blog: createBlog, file: Express.Multer.File, user: AuthUser) {
    const { schedule, draft, ...data } = blog;

    if (file) {
      const thumbnail = await this.uploadFile.uploadDocument(file);
      console.log(thumbnail);
      data.thumbnail = thumbnail;
    }

    const slug = Slug(data.title);
    const save_data = this.blog.create({
      ...data,
      creatorId: user.id,
      slug,
    });

    if (schedule) {
      if (!data.scheduleDate) {
        throw new ForbiddenException('Schedule data is invalid');
      }

      // schedule the blog
      const delay = data.scheduleDate.getTime() - Date.now();
      const blog = await this.blog.save({
        ...save_data,
        status: blogStatus.Schedule,
      });
      this.blogJobWorker.scheduleDelayedEmail({ id: blog.id }, delay);
      return blog;
    }

    return this.blog.save({
      ...save_data,
      status: draft ? blogStatus.draft : blogStatus.publish,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ data: string }> {
    if (!file) {
      throw new ForbiddenException('File not provided');
    }

    const uri = await this.uploadFile.uploadDocument(file);
    return { data: uri };
  }

  findAll(query: findManyBlog): Promise<DocumentResult<BlogManager>> {
    const filters = this.filter(query);
    const qb = this.blog.createQueryBuilder('blog');
    buildFindManyQuery(
      qb,
      'blog',
      filters,
      query.search,
      ['title', 'content'],
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
        .where({ id: document?.data?.id })
        .execute();
    }

    return document;
  }

  async update(
    param: paramSearch,
    update: updatedBlog,
    user?: AuthUser,
    file?: Express.Multer.File,
  ): Promise<BlogManager> {
    const blog = await this.blog.findOne({ where: { id: param.id } });

    if (!blog) {
      throw new ForbiddenException('Blog post not found');
    }

    if (user) {
      if (
        blog.creatorId !== user.id &&
        ![Role.admin, Role.superAdmin].includes(user.role)
      ) {
        throw new ForbiddenException('You are not the creator of this blog');
      }
    }

    if (file) {
      const thumbnail = await this.uploadFile.uploadDocument(file);
      update.thumbnail = thumbnail;
    }

    if (update.title) {
      update.slug = Slug(update.title);
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

      this.blogJobWorker.scheduleDelayedEmail(param, delay);
      await this.blog.update(param, { ...update });
      return { ...blog, ...update };
    }

    // // if blog status is schedule and the updated status is still schedule
    // if (
    //   blog?.status === blogStatus.Schedule &&
    //   update.status === blogStatus.Schedule
    // ) {
    //   return this.blog.update({ id: blog.id }, update);
    // }
    // when any of them is not responding
    await this.blog.update(param, { ...update });
    return { ...blog, ...update };
  }

  async remove(param: paramSearch, user: AuthUser) {
    const blog = await this.blog.findOne({ where: { id: param.id } });

    if (!blog) {
      throw new ForbiddenException('Blog post not found');
    }

    if (
      blog.creatorId !== user.id &&
      ![Role.admin, Role.superAdmin].includes(user.role)
    ) {
      throw new ForbiddenException('You are not the creator of this blog');
    }

    return this.blog.delete(param.id);
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
}
