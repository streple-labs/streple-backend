import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  createLearning,
  findManyLearning,
  findOneLearning,
  hubStatus,
  hubType,
  Level,
  updatedLearning,
} from '../interface';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { FindMany, FindOne, transform } from 'src/global/common';
import { Transform } from 'class-transformer';

export class CreateLearning implements createLearning {
  @ApiProperty({ type: String, enum: Object.values(hubStatus) })
  @IsString()
  @IsIn(Object.values(hubStatus))
  @IsNotEmpty()
  status: hubStatus;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @IsUrl()
  document: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @IsUrl()
  thumbnail: string;

  @ApiProperty({ type: String, enum: Object.values(Level) })
  @IsEnum(Level)
  @IsString()
  @IsIn(Object.values(Level))
  level: Level;

  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(hubType))
  @ApiProperty({ type: String, enum: Object.values(hubType) })
  type: hubType;
}

export class UpdateLearning
  extends PartialType(CreateLearning)
  implements updatedLearning {}

export class FindManyLearning extends FindMany implements findManyLearning {
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  title: string[];

  @IsString({ each: true })
  @IsIn(Object.values(Level))
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  level: Level[];

  @IsString({ each: true })
  @IsOptional()
  @IsIn(Object.values(hubStatus))
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiPropertyOptional({ type: [String], enum: Object.values(hubStatus) })
  status: hubStatus[];

  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiPropertyOptional({ type: [String] })
  description: string;

  @IsString()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @IsIn(Object.values(hubType))
  type: hubType[];

  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: string | number | Date }) => new Date(value))
  @ApiPropertyOptional({ type: Date })
  startFrom: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: string | number | Date }) => new Date(value))
  @ApiPropertyOptional({ type: Date })
  endOn: Date;
}

export class FindOneLearning extends FindOne implements findOneLearning {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @Transform(({ value }: { value: string }) => value.trim())
  title: string;

  @IsString()
  @IsIn(Object.values(Level))
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value.trim())
  level: Level;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(hubStatus))
  @Transform(({ value }: { value: string }) => value.trim())
  @ApiPropertyOptional({ type: String, enum: Object.values(hubStatus) })
  status: hubStatus;
}
