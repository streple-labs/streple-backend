import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  createProgress,
  findManyGameProgress,
  findManyOnboardedUser,
  gameOnboard,
  Level,
  Phase,
} from '../interface';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FindMany, transform } from '@app/common';

export class GamifieldOnboard implements gameOnboard {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, required: true })
  firstQuestion: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, required: true })
  secondQuestion: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, required: true })
  thirdQuestion: string;

  @IsOptional()
  hasAnswer: boolean = true;
}

export class CreateGameProgress implements createProgress {
  @IsNotEmpty()
  @IsIn(Object.values(Phase))
  @ApiProperty({ type: String, required: true })
  phase: Phase;

  @IsNotEmpty()
  @IsIn(Object.values(Level))
  @ApiProperty({ type: String, required: true })
  level: Level;

  @IsInt()
  @Transform(({ value }: { value: string }) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 33 : parsed;
  })
  @ApiProperty({ type: String, required: true })
  score: number;
}

export class FindManyOnboardedUser
  extends FindMany
  implements findManyOnboardedUser
{
  @IsOptional()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  userId?: string[];

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return [true];
    if (value === 'false' || value === false) return [false];
  })
  hasAnswer?: boolean;
}

export class FindManyGameProgress
  extends FindMany
  implements findManyGameProgress
{
  @IsOptional()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  userId: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsIn(Object.values(Phase), { each: true })
  @ApiPropertyOptional({ type: [String], enum: Object.values(Phase) })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  phase: Phase[];

  @IsOptional()
  @IsString({ each: true })
  @IsIn(Object.values(Level), { each: true })
  @ApiPropertyOptional({ type: [String], enum: Object.values(Level) })
  @Transform(({ value }: transform) =>
    typeof value === 'string' ? [value] : value,
  )
  level: Level[];
}
