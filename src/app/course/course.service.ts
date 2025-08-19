import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Course } from './course.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async findAll(filter?: {
    search?: string;
    status?: string;
  }): Promise<Course[]> {
    const whereConditions = {};

    if (filter?.search) {
      Object.assign(whereConditions, { title: ILike(`%${filter.search}%`) });
    }

    if (filter?.status) {
      Object.assign(whereConditions, { status: filter.status });
    }

    return this.courseRepo.find({
      where: whereConditions,
      order: { dateAdded: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Course | null> {
    return this.courseRepo.findOneBy({ id });
  }

  async create(course: Partial<Course>): Promise<Course> {
    const newCourse = this.courseRepo.create(course);
    return this.courseRepo.save(newCourse);
    return this.courseRepo.save(course);
  }

  async update(
    id: number,
    updateData: Partial<Course>,
  ): Promise<Course | null> {
    await this.courseRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.courseRepo.delete(id);
  }
}
