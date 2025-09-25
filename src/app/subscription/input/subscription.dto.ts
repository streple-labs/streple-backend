import { FindMany, FindOne, transform } from '@app/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  createSub,
  findManySubscription,
  findOneSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './subscription.interface';

export class FindManySubscription
  extends FindMany
  implements findManySubscription
{
  @IsOptional()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @Transform(({ value }: { value: transform }) =>
    typeof value === 'string' ? [value] : value,
  )
  userId?: string[];

  @IsOptional()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  @IsIn(Object.values(SubscriptionStatus), { each: true })
  @Transform(({ value }: { value: transform }) =>
    typeof value === 'string' ? [value] : value,
  )
  status?: SubscriptionStatus[];

  @IsOptional()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  @IsIn(Object.values(SubscriptionPlan), { each: true })
  @Transform(({ value }: { value: transform }) =>
    typeof value === 'string' ? [value] : value,
  )
  plan?: SubscriptionPlan[];
}

export class FindOneSubscription
  extends FindOne
  implements findOneSubscription
{
  @IsUUID()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    enum: Object.values(SubscriptionStatus),
  })
  @IsIn(Object.values(SubscriptionStatus))
  status?: SubscriptionStatus;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String, enum: Object.values(SubscriptionPlan) })
  @IsIn(Object.values(SubscriptionPlan))
  plan?: SubscriptionPlan;
}

export class CreateSub implements createSub {
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, format: 'uuid' })
  idempotencyKey: string;
}

export class CancelSubscription {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  reason: string;
}
