import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { findMany, findOne, paramSearch } from './global.interface';

export class FindMany implements findMany {
  @Min(1)
  @IsInt()
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @ApiPropertyOptional({ type: Number })
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 30))
  @ApiPropertyOptional({ type: Number })
  limit?: number = 30;

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }: { value: string | string[] }) =>
    typeof value === 'string' ? [value] : value,
  )
  sort?: string[] = ['updatedAt'];

  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @IsString({ each: true })
  @Transform(({ value }: { value: string | string[] }) =>
    typeof value === 'string' ? [value] : value,
  )
  include?: string[];

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  search?: string;
}

export class FindOne implements findOne {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    required: true,
    example: '60950178-506c-4687-9008-67d79f74f472',
  })
  id: string;

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }: { value: string | string[] }) =>
    typeof value === 'string' ? [value] : value,
  )
  sort?: string[] = ['updatedAt'];

  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  @IsString({ each: true })
  @Transform(({ value }: { value: string | string[] }) =>
    typeof value === 'string' ? [value] : value,
  )
  include?: string[];
}

export class ParamSearch implements paramSearch {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
