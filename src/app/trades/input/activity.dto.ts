import { IsOptional, IsString, IsUUID } from 'class-validator';
import { findManyActivity } from './activity.interface';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindManyActivity implements findManyActivity {
  @IsOptional()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({ type: [String] })
  userId?: string[];

  @IsOptional()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  title?: string[];
}
