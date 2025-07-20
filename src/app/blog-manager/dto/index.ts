import { OmitType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  blogStatus,
  createBlog,
  findManyBlog,
  findOneBlog,
  updatedBlog,
} from '../interface';
import { FindMany, FindOne, transform } from 'src/global/common';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateBlog implements createBlog {
  @ApiProperty({ type: Boolean, required: true })
  @IsBoolean()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  draft: boolean;

  @ApiProperty({ type: Boolean, required: true })
  @IsBoolean()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  schedule: boolean;

  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ type: String, required: false, format: 'url' })
  @IsString()
  @IsOptional()
  @IsUrl()
  thumbnail: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  metatitle: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ type: Date, required: false })
  @IsDate()
  @Transform(({ value }: { value: string | Date }) => new Date(value))
  scheduleDate: Date;
}

export class UpdateBlog
  extends OmitType(CreateBlog, ['schedule', 'draft'])
  implements updatedBlog
{
  @IsOptional()
  @IsString()
  @IsIn(Object.values(blogStatus))
  status?: blogStatus;
}

export class FindManyBlog extends FindMany implements findManyBlog {
  @IsOptional()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], required: false })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  tags?: string[];

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ type: [String], required: false })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @IsString({ each: true })
  creatorId?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsIn(Object.values(blogStatus))
  @IsEnum(blogStatus, { each: true })
  @ApiPropertyOptional({ enum: blogStatus, isArray: true, required: false })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  status?: blogStatus[];

  @IsOptional()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], required: false })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  metatitle?: string[];

  @IsOptional()
  @IsDate()
  @ApiPropertyOptional({ required: false })
  @Transform(({ value }: { value: string | Date }) => new Date(value))
  startFrom?: Date;

  @IsOptional()
  @IsDate()
  @ApiPropertyOptional({ required: false })
  @Transform(({ value }: { value: string | Date }) => new Date(value))
  endAt?: Date;
}

export class FindOneBlog extends FindOne implements findOneBlog {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false })
  tags?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false })
  creatorId?: string;

  @IsOptional()
  @IsEnum(blogStatus)
  @IsIn(Object.values(blogStatus))
  @ApiPropertyOptional({ enum: blogStatus, required: false })
  status?: blogStatus;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false })
  metatitle?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false })
  slug?: string;
}
