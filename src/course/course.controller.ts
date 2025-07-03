import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { Course } from './course.entity';

@Controller('courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  //   @Get()
  //   findAll(
  //     @Query('search') search?: string,
  //     @Query('status') status?: string,
  //   ): Promise<Course[]> {
  //     return this.service.findAll(search, status);
  //   }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Course | null> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() course: Partial<Course>): Promise<Course> {
    return this.service.create(course);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() course: Partial<Course>,
  ): Promise<Course | null> {
    return this.service.update(id, course);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.service.remove(id);
  }
}
