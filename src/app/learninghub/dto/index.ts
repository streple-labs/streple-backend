import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { FindMany, FindOne, transform } from 'src/global/common';
import {
  createLearning,
  findManyLearning,
  findOneLearning,
  hubStatus,
  hubType,
  Level,
  question,
  updatedLearning,
} from '../interface';

class Questions implements question {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  option1: string;

  @IsString()
  @IsNotEmpty()
  option2: string;

  @IsString()
  @IsNotEmpty()
  option3: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}
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
  content?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  document?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  thumbnail?: string;

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

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => Questions)
  @ApiPropertyOptional({ type: [Questions] })
  questions: question[];
}

export class UpdateLearning
  extends PartialType(OmitType(CreateLearning, ['document']))
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
  @IsIn(Object.values(Level), { each: true })
  @ApiPropertyOptional({ type: [String], enum: Object.values(Level) })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  level: Level[];

  @IsString({ each: true })
  @IsOptional()
  @IsIn(Object.values(hubStatus), { each: true })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    enum: Object.values(hubStatus),
  })
  status: hubStatus[];

  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiPropertyOptional({ type: [String] })
  description: string;

  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @ApiPropertyOptional({ type: [String] })
  creatorId?: string[];

  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  @IsIn(Object.values(hubType))
  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    enum: Object.values(hubType),
  })
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
  title: string;

  @IsString()
  @IsIn(Object.values(Level))
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  level: Level;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(hubStatus))
  @ApiPropertyOptional({ type: String, enum: Object.values(hubStatus) })
  status: hubStatus;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  slug?: string;
}
