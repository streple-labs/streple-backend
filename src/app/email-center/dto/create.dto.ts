import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { createEmail, EmailRecipient } from '../interface';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmailCenter implements createEmail {
  @IsBoolean()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @ApiProperty({ type: Boolean })
  schedule: boolean;

  @IsBoolean()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @ApiProperty({ type: Boolean })
  draft: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  subject: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  message: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String, enum: Object.values(EmailRecipient) })
  @IsIn(Object.values(EmailRecipient))
  recipient: EmailRecipient;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ type: [String] })
  selected: string[];

  @IsOptional()
  @ApiPropertyOptional({ type: Date })
  @IsDate()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @Transform(({ value }) => new Date(value))
  scheduleDate: Date;
}
