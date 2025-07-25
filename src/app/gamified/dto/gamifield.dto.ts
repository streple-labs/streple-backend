import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { createProgress, gameOnboard, Level, Phase } from '../interface';
import { ApiProperty } from '@nestjs/swagger';

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
