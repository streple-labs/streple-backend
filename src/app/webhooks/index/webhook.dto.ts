import { FindMany, FindOne, transform } from '@app/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import {
  findManyEvent,
  findOneEvent,
  notificationType,
} from './webhook.interface';

export class FindManyEvent extends FindMany implements findManyEvent {
  @IsOptional()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  id?: string[];

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  version?: number;

  @IsString()
  @IsOptional()
  @IsEnum(Object.values(notificationType))
  @IsIn(Object.values(notificationType))
  @ApiPropertyOptional({ type: String, enum: Object.values(notificationType) })
  notificationType?: notificationType;
}

export class FindOneEvent extends FindOne implements findOneEvent {
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  version?: number;

  @IsString()
  @IsOptional()
  @IsEnum(Object.values(notificationType))
  @IsIn(Object.values(notificationType))
  @ApiPropertyOptional({ type: String, enum: Object.values(notificationType) })
  notificationType?: notificationType;
}
