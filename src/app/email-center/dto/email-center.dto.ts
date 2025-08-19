import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { FindMany, FindOne } from 'src/global/common';
import {
  EmailRecipient,
  EmailStatus,
  findManyEmail,
  findOneEmail,
  updateEmail,
} from '../interface';
import { CreateEmailCenter } from './create.dto';

export class UpdateEmailCenterDto
  extends PartialType(OmitType(CreateEmailCenter, ['draft', 'schedule']))
  implements updateEmail
{
  @IsString()
  @IsIn(Object.values(EmailStatus))
  @IsOptional()
  status?: EmailStatus;
}

export class FindManyEmail extends FindMany implements findManyEmail {
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String], enum: Object.values(EmailStatus) })
  @Transform(({ value }: { value: string | string[] }) =>
    typeof value === 'string' ? [value] : value,
  )
  status?: EmailStatus[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }: { value: string | string[] }) =>
    typeof value === 'string' ? [value] : value,
  )
  recipient?: EmailRecipient[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of ISO date strings',
  })
  @IsOptional()
  @IsDate({ each: true })
  @Transform(({ value }: { value: Date | Date[] }) =>
    Array.isArray(value)
      ? value.map((v) => new Date(v))
      : typeof value === 'string'
        ? [new Date(value)]
        : value,
  )
  scheduleDate?: Date[];
}

export class FindOneEmail extends FindOne implements findOneEmail {
  @IsString()
  @IsOptional()
  @IsIn(Object.values(EmailStatus))
  @ApiPropertyOptional({ type: String })
  status?: EmailStatus;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  openRate?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  clickRate?: number;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(EmailRecipient))
  @ApiPropertyOptional({ type: String, enum: Object.values(EmailRecipient) })
  recipient?: EmailRecipient;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional({ type: Date })
  scheduleDate?: Date;
}
